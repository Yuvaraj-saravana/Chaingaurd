const prisma = require('../config/db');
const { calculateSHA256 } = require('../services/cryptoService');

/**
 * Question Setter Submits DRAFT paper for Review
 * POST /api/papers/:id/submit
 */
async function submitForReview(req, res) {
  try {
    const { id } = req.params;

    const paper = await prisma.questionPaper.findUnique({
      where: { id }
    });

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found.'
      });
    }

    // Role check: Only setter author can submit
    if (req.user.role === 'SETTER' && paper.setterId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only submit your own papers for review.'
      });
    }

    if (paper.status !== 'DRAFT' && paper.status !== 'MODIFICATION_REQUESTED') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit paper with status '${paper.status}'. Paper must be in DRAFT state.`
      });
    }

    // Update status to PENDING_REVIEW
    const updatedPaper = await prisma.questionPaper.update({
      where: { id },
      data: { status: 'PENDING_REVIEW' }
    });

    // Audit log
    await prisma.accessLog.create({
      data: {
        paperId: id,
        userId: req.user.id,
        userRole: req.user.role,
        ipAddress: req.ip || '127.0.0.1',
        action: 'SUBMIT_FOR_REVIEW',
        result: 'GRANTED'
      }
    });

    // Blockchain Anchor
    const { recordTransaction } = require('../services/blockchainService');
    await recordTransaction({
      paperId: id,
      action: 'SUBMIT_REVIEW',
      userId: req.user.id,
      payloadData: {
        paperId: id,
        subjectCode: paper.subjectCode,
        setter: req.user.username,
        submittedAt: new Date().toISOString()
      },
      mspId: 'Org1MSP'
    });

    return res.json({
      success: true,
      message: `Paper '${paper.subjectCode}' submitted for Moderator/Reviewer audit. Status is now PENDING_REVIEW.`,
      paper: updatedPaper
    });
  } catch (error) {
    console.error('Submit for Review Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit paper for review.'
    });
  }
}

/**
 * Reviewer / Moderator Audit & Sign-off
 * POST /api/papers/:id/review
 */
async function reviewerApprove(req, res) {
  try {
    const { id } = req.params;
    const { decision, comments } = req.body;

    if (!decision || !['APPROVED', 'REJECTED', 'MODIFICATION_REQUESTED'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be one of: 'APPROVED', 'REJECTED', 'MODIFICATION_REQUESTED'."
      });
    }

    const paper = await prisma.questionPaper.findUnique({
      where: { id }
    });

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found.'
      });
    }

    if (paper.status !== 'PENDING_REVIEW') {
      return res.status(400).json({
        success: false,
        message: `Paper status is '${paper.status}'. Reviewer action requires status 'PENDING_REVIEW'.`
      });
    }

    // Compute digital signature hash for non-repudiation
    const timestamp = new Date().toISOString();
    const signatureHash = calculateSHA256(
      `${id}:${req.user.id}:REVIEWER:${decision}:${timestamp}:${comments || ''}`
    );

    // Determine target paper status
    let nextStatus = paper.status;
    if (decision === 'APPROVED') {
      nextStatus = 'REVIEWER_APPROVED';
    } else if (decision === 'REJECTED') {
      nextStatus = 'REJECTED';
    } else if (decision === 'MODIFICATION_REQUESTED') {
      nextStatus = 'DRAFT';
    }

    // Record approval log
    const approvalRecord = await prisma.approval.create({
      data: {
        paperId: id,
        userId: req.user.id,
        approvalRole: 'REVIEWER',
        decision,
        comments: comments ? comments.trim() : null,
        signatureHash,
        actionTimestamp: new Date()
      }
    });

    // Update Paper Status
    const updatedPaper = await prisma.questionPaper.update({
      where: { id },
      data: { status: nextStatus }
    });

    // Record Audit Log
    await prisma.accessLog.create({
      data: {
        paperId: id,
        userId: req.user.id,
        userRole: req.user.role,
        ipAddress: req.ip || '127.0.0.1',
        action: `REVIEWER_${decision}`,
        result: 'GRANTED'
      }
    });

    // Anchor Blockchain Transaction
    const { recordTransaction } = require('../services/blockchainService');
    await recordTransaction({
      paperId: id,
      action: 'APPROVE_REVIEW',
      userId: req.user.id,
      payloadData: {
        paperId: id,
        approvalRole: 'REVIEWER',
        decision,
        approver: req.user.username,
        signatureHash,
        timestamp
      },
      mspId: 'Org2MSP'
    });

    return res.json({
      success: true,
      message: `Reviewer review recorded successfully. Paper status is now '${nextStatus}'.`,
      paper: updatedPaper,
      approval: approvalRecord
    });
  } catch (error) {
    console.error('Reviewer Approval Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process reviewer approval.'
    });
  }
}

/**
 * Exam Controller Final Approval & Sign-off
 * POST /api/papers/:id/controller-approve
 */
async function controllerApprove(req, res) {
  try {
    const { id } = req.params;
    const { decision, comments } = req.body;

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be either 'APPROVED' or 'REJECTED'."
      });
    }

    const paper = await prisma.questionPaper.findUnique({
      where: { id },
      include: {
        approvals: true
      }
    });

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found.'
      });
    }

    // Controller approval requires Reviewer Approval step completed!
    if (paper.status !== 'REVIEWER_APPROVED') {
      return res.status(400).json({
        success: false,
        message: `Multi-Signature Rule Violation: Paper status is '${paper.status}'. Exam Controller approval requires status 'REVIEWER_APPROVED'.`
      });
    }

    // Compute digital signature hash
    const timestamp = new Date().toISOString();
    const signatureHash = calculateSHA256(
      `${id}:${req.user.id}:CONTROLLER:${decision}:${timestamp}:${comments || ''}`
    );

    const nextStatus = decision === 'APPROVED' ? 'READY_FOR_RELEASE' : 'REJECTED';

    // Record approval log
    const approvalRecord = await prisma.approval.create({
      data: {
        paperId: id,
        userId: req.user.id,
        approvalRole: 'CONTROLLER',
        decision,
        comments: comments ? comments.trim() : null,
        signatureHash,
        actionTimestamp: new Date()
      }
    });

    // Update Paper Status
    const updatedPaper = await prisma.questionPaper.update({
      where: { id },
      data: { status: nextStatus }
    });

    // Record Audit Log
    await prisma.accessLog.create({
      data: {
        paperId: id,
        userId: req.user.id,
        userRole: req.user.role,
        ipAddress: req.ip || '127.0.0.1',
        action: `CONTROLLER_${decision}`,
        result: 'GRANTED'
      }
    });

    // Anchor Blockchain Transaction
    await recordTransaction({
      paperId: id,
      action: 'AUTHORIZE_RELEASE',
      userId: req.user.id,
      payloadData: {
        paperId: id,
        approvalRole: 'CONTROLLER',
        decision,
        controller: req.user.username,
        signatureHash,
        timestamp
      },
      mspId: 'Org1MSP'
    });

    return res.json({
      success: true,
      message: `Exam Controller approval granted. Paper is now '${nextStatus}'.`,
      paper: updatedPaper,
      approval: approvalRecord
    });
  } catch (error) {
    console.error('Controller Approval Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process controller approval.'
    });
  }
}

/**
 * Get Approval History & Signature Sign-offs for a Paper
 * GET /api/papers/:id/approvals
 */
async function getApprovalHistory(req, res) {
  try {
    const { id } = req.params;

    const approvals = await prisma.approval.findMany({
      where: { paperId: id },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, role: true, department: true }
        }
      },
      orderBy: { actionTimestamp: 'asc' }
    });

    return res.json({
      success: true,
      count: approvals.length,
      approvals
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve approval history.'
    });
  }
}

module.exports = {
  submitForReview,
  reviewerApprove,
  controllerApprove,
  getApprovalHistory
};
