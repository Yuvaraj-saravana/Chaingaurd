const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password using bcrypt
 * @param {string} password 
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare plain text password with hashed password
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
  if (!password || !hash) return false;
  return await bcrypt.compare(password, hash);
}

/**
 * Validate password complexity:
 * Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character
 * @param {string} password 
 * @returns {{ valid: boolean, message?: string }}
 */
function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*).' };
  }
  return { valid: true };
}

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength
};
