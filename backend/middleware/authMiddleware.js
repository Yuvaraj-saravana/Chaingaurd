const { verifyToken } = require('../utils/jwtUtils');
const prisma = require('../config/db');

/**
 * Authentication Middleware
 * Validates JWT Bearer token and attaches user record to req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Session expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Invalid authorization token.'
      });
    }

    // Verify user exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        fullName: true,
        department: true,
        isActive: true,
        failedLogins: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact Exam Security Administrator.'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
}

module.exports = authenticate;
