const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { calculateSHA256, decryptBuffer } = require('./cryptoService');
const { getEncryptionKey } = require('./keyManagementService');
const prisma = new PrismaClient();

function resolveEncryptedFilePath(storedPath) {
  if (!storedPath) return null;
  if (fs.existsSync(storedPath)) return storedPath;
  const storageDir = path.resolve(process.env.ENCRYPTED_STORAGE_DIR || './storage/encrypted_papers');
  const resolved = path.join(storageDir, path.basename(storedPath));
  if (fs.existsSync(resolved)) return resolved;
  return storedPath;
}

/**
 * Verify cryptographic SHA-256 hash and AES-GCM authentication tag of a paper
 * @param {string} paperId 
 * @param {string|null} userId 
 * @param {string|null} ipAddress 
 * @returns {Promise<Object>} Verification status report
 */
async function verifyPaperIntegrity(paperId, userId = null, ipAddress = null) {
  const paper = await prisma.questionPaper.findUnique({
    where: { id: paperId },
    include: { encryptionMetadata: true }
  });

  if (!paper) {
    return {
      verified: false,
      status: 'NOT_FOUND',
      message: 'Paper not found in system database.'
    };
  }

  const filePath = resolveEncryptedFilePath(paper.encryptedFilePath);

  if (!filePath || !fs.existsSync(filePath)) {
    return {
      verified: false,
      status: 'FILE_MISSING',
      message: 'Encrypted paper payload file is missing from vault storage.'
    };
  }

  // 1. Calculate current SHA-256 hash of file on disk
  const encryptedPayload = fs.readFileSync(filePath);
  const currentFileHash = calculateSHA256(encryptedPayload);

  let gcmAuthTagVerified = false;
  let gcmError = null;

  // 2. Test AES-256-GCM authentication tag integrity
  if (paper.encryptionMetadata && !paper.encryptionMetadata.isRevoked) {
    try {
      const keyBuffer = getEncryptionKey(paper.encryptionMetadata.keyReference);
      decryptBuffer(
        encryptedPayload,
        keyBuffer,
        paper.encryptionMetadata.ivHex,
        paper.encryptionMetadata.authTagHex
      );
      gcmAuthTagVerified = true;
    } catch (err) {
      gcmAuthTagVerified = false;
      gcmError = err.message;
    }
  }

  const hashMatches = (currentFileHash === paper.fileSha256Hash);
  const isClean = hashMatches && gcmAuthTagVerified;

  if (!isClean) {
    // TAMPERING DETECTED!
    // Auto-freeze paper if not already frozen
    if (paper.status !== 'FROZEN') {
      await prisma.questionPaper.update({
        where: { id: paperId },
        data: { status: 'FROZEN' }
      }).catch(() => null);
    }

    // Log Access Alert
    await prisma.accessLog.create({
      data: {
        paperId: paper.id,
        userId: userId,
        userRole: 'SYSTEM_AUDITOR',
        ipAddress: ipAddress || '127.0.0.1',
        action: 'INTEGRITY_CHECK',
        result: 'DENIED_INTEGRITY_FAIL',
        denialReason: `CRYPTOGRAPHIC_MISMATCH | HashMatches: ${hashMatches} | GCMValid: ${gcmAuthTagVerified}`
      }
    }).catch(() => null);

    // Create Critical Security Alert
    await prisma.securityAlert.create({
      data: {
        alertType: 'HASH_MISMATCH',
        severity: 'CRITICAL',
        paperId: paper.id,
        userId: userId,
        description: `CRITICAL ALERT: File SHA-256 or GCM auth tag mismatch detected for paper '${paper.title}' (${paper.subjectCode}). Expected: ${paper.fileSha256Hash}, Actual: ${currentFileHash}. Paper automatically FROZEN.`,
        status: 'NEW'
      }
    }).catch(() => null);

    // Call AI microservice asynchronously to log anomaly
    try {
      const fetch = (await import('node-fetch')).default;
      await fetch('http://localhost:5001/detect-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || 'SYSTEM',
          paper_id: paperId,
          role: 'AUDITOR',
          action: 'HASH_MISMATCH_ALERT',
          ip_address: ipAddress || '127.0.0.1',
          time_gated_status: 'TAMPER_DETECTED'
        })
      });
    } catch (err) {
      // AI service optional fallback
    }

    return {
      verified: false,
      status: 'TAMPERING_DETECTED',
      paperId: paper.id,
      title: paper.title,
      subjectCode: paper.subjectCode,
      paperStatus: 'FROZEN',
      expectedHash: paper.fileSha256Hash,
      actualHash: currentFileHash,
      gcmAuthTagVerified: gcmAuthTagVerified,
      gcmError: gcmError,
      timestamp: new Date().toISOString(),
      message: 'CRITICAL SECURITY ALERT: Cryptographic SHA-256 hash digest mismatch or AES-GCM auth tag corruption detected! Paper has been automatically locked down (FROZEN).'
    };
  }

  // INTEGRITY VERIFIED CLEAN
  await prisma.accessLog.create({
    data: {
      paperId: paper.id,
      userId: userId,
      userRole: 'SYSTEM_AUDITOR',
      ipAddress: ipAddress || '127.0.0.1',
      action: 'INTEGRITY_CHECK',
      result: 'GRANTED',
      denialReason: null
    }
  }).catch(() => null);

  return {
    verified: true,
    status: 'INTEGRITY_VERIFIED',
    paperId: paper.id,
    title: paper.title,
    subjectCode: paper.subjectCode,
    paperStatus: paper.status,
    expectedHash: paper.fileSha256Hash,
    actualHash: currentFileHash,
    gcmAuthTagVerified: true,
    timestamp: new Date().toISOString(),
    message: 'Cryptographic integrity verified cleanly. Encrypted payload hash matches registered audit ledger.'
  };
}

/**
 * Simulate disk byte corruption on an encrypted paper file
 * @param {string} paperId 
 * @param {string|null} userId 
 * @returns {Promise<Object>}
 */
async function simulatePaperTampering(paperId, userId = null) {
  const paper = await prisma.questionPaper.findUnique({ where: { id: paperId } });
  if (!paper) throw new Error('Paper not found.');

  const filePath = resolveEncryptedFilePath(paper.encryptedFilePath);
  if (!filePath || !fs.existsSync(filePath)) throw new Error('Encrypted payload file missing from storage vault.');
  
  const backupPath = filePath + '.bak';

  // Create backup if not present
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }

  // Mutate content by corrupting payload bytes
  const buf = fs.readFileSync(filePath);
  // Flip bytes in payload
  const corruptedBuf = Buffer.from(buf);
  for (let i = 0; i < Math.min(32, corruptedBuf.length); i++) {
    corruptedBuf[i] = corruptedBuf[i] ^ 0xFF;
  }
  fs.writeFileSync(filePath, corruptedBuf);

  await prisma.accessLog.create({
    data: {
      paperId: paper.id,
      userId: userId,
      userRole: 'ADMIN',
      ipAddress: '127.0.0.1',
      action: 'SIMULATE_TAMPER_ATTEMPT',
      result: 'SECURITY_ALERT',
      denialReason: 'SIMULATED_DISK_BYTE_CORRUPTION'
    }
  }).catch(() => null);

  return {
    success: true,
    paperId: paper.id,
    subjectCode: paper.subjectCode,
    message: 'Tampering simulated successfully. Encrypted binary on disk has been corrupted.'
  };
}

/**
 * Restore paper file from clean backup
 * @param {string} paperId 
 * @param {string|null} userId 
 * @returns {Promise<Object>}
 */
async function restorePaperIntegrity(paperId, userId = null) {
  const paper = await prisma.questionPaper.findUnique({ where: { id: paperId } });
  if (!paper) throw new Error('Paper not found.');

  const filePath = resolveEncryptedFilePath(paper.encryptedFilePath);
  const backupPath = filePath ? filePath + '.bak' : null;

  if (backupPath && fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, filePath);
    fs.unlinkSync(backupPath);
  }

  // Restore status from FROZEN back to READY_FOR_RELEASE or REVIEWER_APPROVED if frozen during test
  if (paper.status === 'FROZEN') {
    await prisma.questionPaper.update({
      where: { id: paperId },
      data: { status: 'READY_FOR_RELEASE' }
    });
  }

  await prisma.accessLog.create({
    data: {
      paperId: paper.id,
      userId: userId,
      userRole: 'ADMIN',
      ipAddress: '127.0.0.1',
      action: 'RESTORE_TAMPER_ACTION',
      result: 'GRANTED',
      denialReason: 'INTEGRITY_RESTORED_FROM_BACKUP'
    }
  }).catch(() => null);

  return {
    success: true,
    paperId: paper.id,
    subjectCode: paper.subjectCode,
    message: 'Paper integrity restored from secure vault backup.'
  };
}

module.exports = {
  verifyPaperIntegrity,
  simulatePaperTampering,
  restorePaperIntegrity
};
