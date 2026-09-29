const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');

const KEYS_DIR = path.resolve(process.env.KEYS_STORAGE_DIR || './storage/keys');

// Ensure key directory exists
if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
}

/**
 * Key Management Service (KMS)
 * Manages lifecycle of cryptographic keys separated from encrypted files
 */
class KeyManagementService {
  /**
   * Save an encryption key securely
   * @param {string} paperId 
   * @param {Buffer} keyBuffer 
   * @returns {string} Key reference path
   */
  static storeKey(paperId, keyBuffer) {
    const keyFileName = `${paperId}.key`;
    const keyPath = path.join(KEYS_DIR, keyFileName);

    // Save key file securely
    fs.writeFileSync(keyPath, keyBuffer, { mode: 0o600 });
    return keyFileName;
  }

  /**
   * Retrieve an encryption key if active and not revoked
   * @param {string} paperId 
   * @returns {Buffer} Key buffer
   */
  static async getKey(paperId) {
    // Check revocation status in DB
    const metadata = await prisma.encryptionMetadata.findUnique({
      where: { paperId }
    });

    if (!metadata) {
      throw new Error(`No encryption metadata found for paper ID: ${paperId}`);
    }

    if (metadata.isRevoked) {
      throw new Error(`Cryptographic key for paper ID '${paperId}' has been REVOKED.`);
    }

    const keyPath = path.join(KEYS_DIR, metadata.keyReference);
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Key file missing from Key Storage Vault for paper ID: ${paperId}`);
    }

    return fs.readFileSync(keyPath);
  }

  /**
   * Revoke an encryption key (post-exam or emergency)
   * @param {string} paperId 
   * @returns {Promise<boolean>}
   */
  static async revokeKey(paperId) {
    const metadata = await prisma.encryptionMetadata.findUnique({
      where: { paperId }
    });

    if (!metadata) return false;

    // Update DB record to marked revoked
    await prisma.encryptionMetadata.update({
      where: { paperId },
      data: {
        isRevoked: true,
        revokedAt: new Date()
      }
    });

    // Zero out and remove key file from filesystem
    const keyPath = path.join(KEYS_DIR, metadata.keyReference);
    if (fs.existsSync(keyPath)) {
      // Overwrite with zeros before deletion
      const fileSize = fs.statSync(keyPath).size;
      fs.writeFileSync(keyPath, Buffer.alloc(fileSize, 0));
      fs.unlinkSync(keyPath);
    }

    console.log(`🔒 Key for paper '${paperId}' has been REVOKED and zeroed.`);
    return true;
  }
}

module.exports = KeyManagementService;
