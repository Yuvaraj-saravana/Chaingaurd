const prisma = require('../config/db');
const { calculateSHA256 } = require('../services/cryptoService');

/**
 * Create New Examination Session
 * POST /api/exams
 */
async function createExam(req, res) {
  try {
    const { examCode, title, course, semester, department, startTime, endTime } = req.body;

    if (!examCode || !title || !course || !semester || !department || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'All fields (examCode, title, course, semester, department, startTime, endTime) are required.'
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date/time format for startTime or endTime.'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Examination end time must be after the start time.'
      });
    }

    // Check existing exam code
    const existing = await prisma.exam.findUnique({
      where: { examCode: examCode.trim().toUpperCase() }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Exam code '${examCode}' already exists.`
      });
    }

    const newExam = await prisma.exam.create({
      data: {
        examCode: examCode.trim().toUpperCase(),
        title: title.trim(),
        course: course.trim(),
        semester: semester.trim(),
        department: department.trim(),
        startTime: start,
        endTime: end,
        status: 'SCHEDULED'
      }
    });

    // Audit Log
    await prisma.accessLog.create({
      data: {
        userId: req.user.id,
        userRole: req.user.role,
        paperId: null, // System action
        action: 'CREATE_EXAM_SCHEDULE',
        result: 'GRANTED',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.status(201).json({
      success: true,
      message: `Exam session '${newExam.examCode}' scheduled successfully.`,
      exam: newExam
    });
  } catch (error) {
    console.error('Create Exam Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create exam session.'
    });
  }
}

/**
 * List All Scheduled Exams
 * GET /api/exams
 */
async function getExams(req, res) {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        questionPapers: {
          include: {
            setter: { select: { id: true, fullName: true, department: true } },
            encryptionMetadata: { select: { algorithm: true, isRevoked: true } }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    return res.json({
      success: true,
      count: exams.length,
      exams
    });
  } catch (error) {
    console.error('Get Exams Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve exam sessions.'
    });
  }
}

/**
 * Get Exam Session Details by ID
 * GET /api/exams/:id
 */
async function getExamById(req, res) {
  try {
    const { id } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questionPapers: {
          include: {
            setter: { select: { id: true, fullName: true, department: true } },
            approvals: true
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam session not found.'
      });
    }

    return res.json({
      success: true,
      exam
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve exam details.'
    });
  }
}

/**
 * Link Approved Question Paper to Exam Session
 * POST /api/exams/:id/link-paper
 */
async function linkPaperToExam(req, res) {
  try {
    const { id } = req.params; // Exam ID
    const { paperId } = req.body;

    if (!paperId) {
      return res.status(400).json({
        success: false,
        message: 'paperId is required.'
      });
    }

    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam session not found.'
      });
    }

    const paper = await prisma.questionPaper.findUnique({
      where: { id: paperId }
    });

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found.'
      });
    }

    // Require paper to be in READY_FOR_RELEASE or REVIEWER_APPROVED status
    if (paper.status !== 'READY_FOR_RELEASE' && paper.status !== 'REVIEWER_APPROVED') {
      return res.status(400).json({
        success: false,
        message: `Cannot link paper with status '${paper.status}'. Paper must be READY_FOR_RELEASE.`
      });
    }

    // Link paper to exam
    const updatedPaper = await prisma.questionPaper.update({
      where: { id: paperId },
      data: { examId: id }
    });

    // Record Audit & Blockchain anchor log
    const payloadHash = calculateSHA256(
      JSON.stringify({ examId: id, paperId, startTime: exam.startTime, endTime: exam.endTime })
    );

    await prisma.blockchainTransaction.create({
      data: {
        txId: `tx_sch_${id.substring(0, 8)}_${Date.now()}`,
        paperId,
        action: 'AUTHORIZE_RELEASE',
        payloadHash,
        status: 'COMMITTED',
        rawPayload: JSON.stringify({
          examCode: exam.examCode,
          paperId,
          startTime: exam.startTime,
          endTime: exam.endTime,
          controller: req.user.username,
          scheduledAt: new Date().toISOString()
        })
      }
    });

    return res.json({
      success: true,
      message: `Paper '${paper.subjectCode}' linked to Exam Session '${exam.examCode}'.`,
      paper: updatedPaper,
      exam
    });
  } catch (error) {
    console.error('Link Paper Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to link paper to exam schedule.'
    });
  }
}

/**
 * Update Exam Session Status
 * PUT /api/exams/:id/status
 */
async function updateExamStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const VALID_STATUSES = ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
    if (!status || !VALID_STATUSES.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses: ${VALID_STATUSES.join(', ')}.`
      });
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: { status: status.toUpperCase() }
    });

    return res.json({
      success: true,
      message: `Exam '${updatedExam.examCode}' status updated to '${updatedExam.status}'.`,
      exam: updatedExam
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update exam status.'
    });
  }
}

module.exports = {
  createExam,
  getExams,
  getExamById,
  linkPaperToExam,
  updateExamStatus
};
