const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');
const { encryptBuffer, calculateSHA256 } = require('../services/cryptoService');
const KeyManagementService = require('../services/keyManagementService');

const ENCRYPTED_DIR = path.resolve(process.env.ENCRYPTED_STORAGE_DIR || './storage/encrypted_papers');

// Ensure storage directory exists
if (!fs.existsSync(ENCRYPTED_DIR)) {
  fs.mkdirSync(ENCRYPTED_DIR, { recursive: true });
}

/**
 * Upload & Encrypt Question Paper
 * POST /api/papers/upload
 */
async function uploadPaper(req, res) {
  try {
    const { title, subjectCode, course, semester, department, examId } = req.body;

    if (!title || !subjectCode || !course || !semester || !department) {
      return res.status(400).json({
        success: false,
        message: 'Missing required metadata: title, subjectCode, course, semester, department.'
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Question paper PDF file is required.'
      });
    }

    const rawBuffer = req.file.buffer;
    const originalFilename = req.file.originalname || `${subjectCode}_Paper.pdf`;
    const fileSizeBytes = rawBuffer.length;

    // Step 1: Calculate SHA-256 Hash of raw PDF
    const fileSha256Hash = calculateSHA256(rawBuffer);

    // Step 2: Encrypt raw PDF using AES-256-GCM
    const { encryptedBuffer, keyBuffer, ivHex, authTagHex } = encryptBuffer(rawBuffer);

    // Step 3: Save encrypted file to off-chain storage vault
    // Generate UUID for paper ID
    const tempPaper = await prisma.questionPaper.create({
      data: {
        title: title.trim(),
        subjectCode: subjectCode.trim().toUpperCase(),
        course: course.trim(),
        semester: semester.trim(),
        department: department.trim(),
        status: 'DRAFT',
        originalFilename,
        fileSizeBytes,
        encryptedFilePath: '',
        fileSha256Hash,
        version: 1,
        setterId: req.user.id,
        ...(examId ? { examId } : {})
      }
    });

    const paperId = tempPaper.id;
    const encryptedFileName = `${paperId}.enc`;
    const fullEncryptedPath = path.join(ENCRYPTED_DIR, encryptedFileName);

    // Write AES encrypted payload to disk
    fs.writeFileSync(fullEncryptedPath, encryptedBuffer);

    // Step 4: Store encryption key in KMS
    const keyReference = KeyManagementService.storeKey(paperId, keyBuffer);

    // Step 5: Save Encryption Metadata record
    await prisma.encryptionMetadata.create({
      data: {
        paperId,
        algorithm: 'AES-256-GCM',
        ivHex,
        authTagHex,
        keyReference,
        isRevoked: false
      }
    });

    // Step 6: Update QuestionPaper with encrypted relative path
    const paper = await prisma.questionPaper.update({
      where: { id: paperId },
      data: {
        encryptedFilePath: encryptedFileName
      },
      include: {
        setter: {
          select: { id: true, username: true, fullName: true, department: true }
        },
        encryptionMetadata: {
          select: { algorithm: true, isRevoked: true, createdAt: true }
        }
      }
    });

    // Step 7: Record Audit Log
    await prisma.accessLog.create({
      data: {
        paperId,
        userId: req.user.id,
        userRole: req.user.role,
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
        action: 'UPLOAD',
        result: 'GRANTED',
        denialReason: null
      }
    });

    // Step 8: Record Immutable Blockchain Anchor Transaction
    const { recordTransaction } = require('../services/blockchainService');
    await recordTransaction({
      paperId,
      action: 'REGISTER',
      userId: req.user.id,
      payloadData: {
        paperId,
        subjectCode: paper.subjectCode,
        sha256: fileSha256Hash,
        setter: req.user.username,
        department: paper.department,
        registeredAt: new Date().toISOString()
      },
      mspId: 'Org1MSP'
    });

    return res.status(201).json({
      success: true,
      message: 'Question paper successfully encrypted (AES-256-GCM) and registered.',
      paper: {
        id: paper.id,
        title: paper.title,
        subjectCode: paper.subjectCode,
        course: paper.course,
        semester: paper.semester,
        department: paper.department,
        status: paper.status,
        version: paper.version,
        originalFilename: paper.originalFilename,
        fileSizeBytes: paper.fileSizeBytes,
        fileSha256Hash: paper.fileSha256Hash,
        setter: paper.setter,
        createdAt: paper.createdAt
      }
    });

  } catch (error) {
    console.error('Paper Upload Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process and encrypt question paper.'
    });
  }
}

/**
 * Get Question Papers (Filtered by User Role)
 * GET /api/papers
 */
async function getPapers(req, res) {
  try {
    const userRole = req.user.role;
    let whereClause = {};

    if (userRole === 'SETTER') {
      // Setters can only see their own authored papers
      whereClause = { setterId: req.user.id };
    } else if (userRole === 'REVIEWER') {
      // Reviewers see papers pending review or reviewed
      whereClause = {
        status: { in: ['PENDING_REVIEW', 'REVIEWER_APPROVED', 'READY_FOR_RELEASE', 'RELEASED', 'CLOSED', 'FROZEN'] }
      };
    } else if (userRole === 'INVIGILATOR') {
      // Invigilators see releasable or active papers
      whereClause = {
        status: { in: ['READY_FOR_RELEASE', 'RELEASED', 'CLOSED'] }
      };
    }
    // Controller and Admin see all papers

    const papers = await prisma.questionPaper.findMany({
      where: whereClause,
      include: {
        setter: {
          select: { id: true, username: true, fullName: true, department: true }
        },
        exam: true,
        approvals: {
          include: {
            user: { select: { id: true, username: true, fullName: true, role: true } }
          }
        },
        encryptionMetadata: {
          select: { algorithm: true, isRevoked: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      count: papers.length,
      papers
    });
  } catch (error) {
    console.error('Get Papers Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve question papers.'
    });
  }
}

/**
 * Get Single Question Paper Details
 * GET /api/papers/:id
 */
async function getPaperById(req, res) {
  try {
    const { id } = req.params;

    const paper = await prisma.questionPaper.findUnique({
      where: { id },
      include: {
        setter: {
          select: { id: true, username: true, fullName: true, department: true }
        },
        exam: true,
        approvals: {
          include: {
            user: { select: { id: true, username: true, fullName: true, role: true } }
          },
          orderBy: { actionTimestamp: 'desc' }
        },
        blockchainTx: true,
        encryptionMetadata: {
          select: { algorithm: true, isRevoked: true, createdAt: true }
        }
      }
    });

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found.'
      });
    }

    // Role check: Setters can only view their own paper details
    if (req.user.role === 'SETTER' && paper.setterId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view details of your own papers.'
      });
    }

    return res.json({
      success: true,
      paper
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve paper details.'
    });
  }
}

module.exports = {
  uploadPaper,
  getPapers,
  getPaperById
};
