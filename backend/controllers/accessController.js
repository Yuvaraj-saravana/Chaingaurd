const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');
const TimeLockService = require('../services/timeLockService');
const KeyManagementService = require('../services/keyManagementService');
const { decryptBuffer, calculateSHA256 } = require('../services/cryptoService');

const ENCRYPTED_DIR = path.resolve(process.env.ENCRYPTED_STORAGE_DIR || './storage/encrypted_papers');

/**
 * Request Access to Examination Question Paper (Time-Locked Access Gate)
 * POST /api/papers/:id/access
 */
async function requestAccess(req, res) {
  try {
    const { id } = req.params;

    const paper = await prisma.questionPaper.findUnique({
      where: { id },
      include: {
        exam: true,
        encryptionMetadata: true,
        setter: { select: { fullName: true, department: true } }
      }
    });

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found.'
      });
    }

    // Role check: Only INVIGILATOR, CONTROLLER, or ADMIN can request access
    const allowedRoles = ['INVIGILATOR', 'CONTROLLER', 'ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      await prisma.accessLog.create({
        data: {
          paperId: id,
          userId: req.user.id,
          userRole: req.user.role,
          ipAddress: req.ip || '127.0.0.1',
          action: 'ATTEMPT',
          result: 'DENIED_ROLE',
          denialReason: `Role '${req.user.role}' is not authorized to access paper.`
        }
      });

      return res.status(403).json({
        success: false,
        code: 'DENIED_ROLE',
        message: `Role '${req.user.role}' is not permitted to access question papers.`
      });
    }

    // Evaluate Time-Lock Access Gate
    const evaluation = await TimeLockService.evaluateAccessWindow(id);

    // Record Access Log
    await prisma.accessLog.create({
      data: {
        paperId: id,
        userId: req.user.id,
        userRole: req.user.role,
        ipAddress: req.ip || '127.0.0.1',
        action: 'ATTEMPT',
        result: evaluation.result,
        denialReason: evaluation.denialReason || null
      }
    });

    // If access is denied:
    if (!evaluation.allowed) {
      // Create Security Alert for premature access attempt
      if (evaluation.result === 'DENIED_PREMATURE') {
        await prisma.securityAlert.create({
          data: {
            alertType: 'PREMATURE_ACCESS',
            severity: 'MEDIUM',
            paperId: id,
            userId: req.user.id,
            description: `Premature paper access attempt by [${req.user.role}] '${req.user.username}' for paper '${paper.subjectCode}'. Time-lock active.`
          }
        });
      }

      return res.status(403).json({
        success: false,
        code: evaluation.result,
        message: evaluation.denialReason,
        timeDeltaSeconds: evaluation.timeDeltaSeconds || null,
        examSchedule: evaluation.exam || null
      });
    }

    // ACCESS GRANTED: Process Decryption in RAM Memory
    const encryptedPath = path.join(ENCRYPTED_DIR, paper.encryptedFilePath || `${id}.enc`);
    if (!fs.existsSync(encryptedPath)) {
      return res.status(500).json({
        success: false,
        message: 'Encrypted ciphertext payload missing from off-chain storage vault.'
      });
    }

    const encryptedBuffer = fs.readFileSync(encryptedPath);
    const keyBuffer = await KeyManagementService.getKey(id);

    // Decrypt paper Buffer
    const decryptedBuffer = decryptBuffer(
      encryptedBuffer,
      keyBuffer,
      paper.encryptionMetadata.ivHex,
      paper.encryptionMetadata.authTagHex
    );

    // Verify SHA-256 integrity on decryption
    const computedHash = calculateSHA256(decryptedBuffer);
    const isIntegrityVerified = computedHash === paper.fileSha256Hash;

    if (!isIntegrityVerified) {
      // Log critical tampering alert
      await prisma.securityAlert.create({
        data: {
          alertType: 'HASH_MISMATCH',
          severity: 'CRITICAL',
          paperId: id,
          userId: req.user.id,
          description: `CRITICAL TAMPERING DETECTED for paper '${paper.subjectCode}'! Decrypted hash does not match blockchain record.`
        }
      });

      return res.status(500).json({
        success: false,
        code: 'INTEGRITY_FAILED',
        message: 'CRITICAL SECURITY FAILURE: Question paper SHA-256 hash mismatch! Access blocked.'
      });
    }

    // Return Access Grant payload
    return res.json({
      success: true,
      message: 'ACCESS GRANTED: Time-lock window active and SHA-256 integrity verified.',
      accessGrant: {
        paperId: paper.id,
        title: paper.title,
        subjectCode: paper.subjectCode,
        course: paper.course,
        semester: paper.semester,
        setter: paper.setter,
        fileSha256Hash: paper.fileSha256Hash,
        integrityStatus: 'FILE_INTEGRITY_VERIFIED',
        decryptedContentBase64: decryptedBuffer.toString('base64'),
        grantedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Access Request Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process access request.'
    });
  }
}

/**
 * Get Access Audit History for a Question Paper
 * GET /api/papers/:id/access-history
 */
async function getAccessHistory(req, res) {
  try {
    const { id } = req.params;

    const accessLogs = await prisma.accessLog.findMany({
      where: { paperId: id },
      include: {
        user: { select: { id: true, username: true, fullName: true, role: true } }
      },
      orderBy: { attemptTimestamp: 'desc' }
    });

    return res.json({
      success: true,
      count: accessLogs.length,
      accessLogs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve access audit history.'
    });
  }
}

module.exports = {
  requestAccess,
  getAccessHistory
};
