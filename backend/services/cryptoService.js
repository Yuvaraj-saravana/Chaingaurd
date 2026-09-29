const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_SIZE_BYTES = 32; // 256 bits
const IV_SIZE_BYTES = 16;  // 128 bits

/**
 * Encrypt a file Buffer using AES-256-GCM
 * @param {Buffer} buffer - Plaintext file buffer
 * @returns {{ encryptedBuffer: Buffer, keyHex: string, keyBuffer: Buffer, ivHex: string, authTagHex: string }}
 */
function encryptBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Input must be a valid Buffer.');
  }

  const keyBuffer = crypto.randomBytes(KEY_SIZE_BYTES);
  const ivBuffer = crypto.randomBytes(IV_SIZE_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, ivBuffer);
  const encryptedBuffer = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTagBuffer = cipher.getAuthTag();

  return {
    encryptedBuffer,
    keyHex: keyBuffer.toString('hex'),
    keyBuffer,
    ivHex: ivBuffer.toString('hex'),
    authTagHex: authTagBuffer.toString('hex')
  };
}

/**
 * Decrypt an AES-256-GCM encrypted Buffer
 * @param {Buffer} encryptedBuffer 
 * @param {Buffer} keyBuffer 
 * @param {string} ivHex 
 * @param {string} authTagHex 
 * @returns {Buffer} Decrypted plaintext buffer
 */
function decryptBuffer(encryptedBuffer, keyBuffer, ivHex, authTagHex) {
  if (!Buffer.isBuffer(encryptedBuffer) || !Buffer.isBuffer(keyBuffer)) {
    throw new Error('Encrypted payload and Key must be valid Buffers.');
  }

  const ivBuffer = Buffer.from(ivHex, 'hex');
  const authTagBuffer = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

/**
 * Compute SHA-256 Hash of a Buffer or String
 * @param {Buffer|string} data 
 * @returns {string} SHA-256 hash in hexadecimal format
 */
function calculateSHA256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
  encryptBuffer,
  decryptBuffer,
  calculateSHA256
};
