const express = require('express');
const router = express.Router({ mergeParams: true });

const { requestAccess, getAccessHistory } = require('../controllers/accessController');
const authenticate = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// All access routes require authentication
router.use(authenticate);

// Request access to paper (Time-locked gate)
router.post('/access', roleGuard(['INVIGILATOR', 'CONTROLLER', 'ADMIN']), requestAccess);

// Get audit access history
router.get('/access-history', getAccessHistory);

module.exports = router;
