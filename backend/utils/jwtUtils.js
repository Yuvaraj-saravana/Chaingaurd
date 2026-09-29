const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chainguard_super_secret_jwt_key_2026_exam_security_platform';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Generate a signed JWT for an authenticated user
 * @param {object} user - User record from database
 * @returns {string} Signed JWT
 */
function generateToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    department: user.department
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT
 * @param {string} token 
 * @returns {object} Decoded payload
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  generateToken,
  verifyToken
};
