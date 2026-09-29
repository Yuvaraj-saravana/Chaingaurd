const express = require('express');
const router = express.Router();

const { login, register, getMe, logout, unlockUser } = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);

// Authenticated routes
router.get('/me', authenticate, getMe);

// Admin-only routes
router.post('/unlock/:userId', authenticate, roleGuard(['ADMIN']), unlockUser);

module.exports = router;
