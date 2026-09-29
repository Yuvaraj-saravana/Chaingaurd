const prisma = require('../config/db');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/jwtUtils');

const VALID_ROLES = ['SETTER', 'REVIEWER', 'CONTROLLER', 'INVIGILATOR', 'ADMIN'];
const MAX_FAILED_ATTEMPTS = 5;

/**
 * User Login
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    // Lookup user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: username.trim().toLowerCase() }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User does not exist.'
      });
    }

    // Check if account is deactivated
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact the Examination Administrator.'
      });
    }

    // Check account lockout due to excessive failed attempts
    if (user.failedLogins >= MAX_FAILED_ATTEMPTS) {
      // Record security alert
      await prisma.securityAlert.create({
        data: {
          alertType: 'FAILED_LOGIN',
          severity: 'HIGH',
          userId: user.id,
          description: `Account '${user.username}' locked due to ${user.failedLogins} consecutive failed login attempts.`
        }
      });

      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: `Account is temporarily locked due to ${MAX_FAILED_ATTEMPTS} consecutive failed attempts. Contact Administrator to unlock.`
      });
    }

    // Verify password
    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      const updatedFailed = user.failedLogins + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: updatedFailed }
      });

      const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - updatedFailed);

      // Create security alert if multiple failures
      if (updatedFailed >= 3) {
        await prisma.securityAlert.create({
          data: {
            alertType: 'FAILED_LOGIN',
            severity: updatedFailed >= 5 ? 'HIGH' : 'MEDIUM',
            userId: user.id,
            description: `Repeated failed login attempt (${updatedFailed}/${MAX_FAILED_ATTEMPTS}) for user '${user.username}'.`
          }
        });
      }

      return res.status(401).json({
        success: false,
        message: `Invalid password. ${remaining} attempt(s) remaining before account lockout.`,
        failedAttempts: updatedFailed,
        remainingAttempts: remaining
      });
    }

    // Login Success: Reset failed logins & update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: 0,
        lastLoginAt: new Date()
      }
    });

    // Generate JWT
    const token = generateToken(user);

    return res.json({
      success: true,
      message: `Welcome, ${user.fullName}. Authentication successful.`,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        department: user.department,
        lastLoginAt: new Date()
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login.'
    });
  }
}

/**
 * Register User (Admin / Self-registration)
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { username, email, password, role, fullName, department } = req.body;

    // Field validations
    if (!username || !email || !password || !role || !fullName || !department) {
      return res.status(400).json({
        success: false,
        message: 'All fields (username, email, password, role, fullName, department) are required.'
      });
    }

    // Validate role
    const normalizedRole = role.toUpperCase();
    if (!VALID_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role '${role}'. Allowed roles: ${VALID_ROLES.join(', ')}.`
      });
    }

    // Validate password complexity
    const pwdValidation = validatePasswordStrength(password);
    if (!pwdValidation.valid) {
      return res.status(400).json({
        success: false,
        message: pwdValidation.message
      });
    }

    // Check existing username or email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: email.trim().toLowerCase() }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already in use.'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: normalizedRole,
        fullName: fullName.trim(),
        department: department.trim(),
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        fullName: true,
        department: true,
        isActive: true,
        createdAt: true
      }
    });

    return res.status(201).json({
      success: true,
      message: `User '${newUser.username}' registered successfully with role '${newUser.role}'.`,
      user: newUser
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register user.'
    });
  }
}

/**
 * Get Current Authenticated User Profile
 * GET /api/auth/me
 */
async function getMe(req, res) {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.'
    });
  }
}

/**
 * Logout User
 * POST /api/auth/logout
 */
async function logout(req, res) {
  return res.json({
    success: true,
    message: 'Logged out successfully. Token invalidated on client.'
  });
}

/**
 * Admin: Unlock or reset user account
 * POST /api/auth/unlock/:userId
 */
async function unlockUser(req, res) {
  try {
    const { userId } = req.params;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { failedLogins: 0, isActive: true },
      select: { id: true, username: true, failedLogins: true, isActive: true }
    });

    return res.json({
      success: true,
      message: `Account '${user.username}' unlocked successfully.`,
      user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to unlock user.'
    });
  }
}

module.exports = {
  login,
  register,
  getMe,
  logout,
  unlockUser
};
