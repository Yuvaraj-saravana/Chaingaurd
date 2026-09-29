const express = require('express');
const router = express.Router();
const { 
  checkPaperIntegrity, 
  triggerSimulateTamper, 
  triggerRestoreTamper, 
  getSecurityAlerts 
} = require('../controllers/integrityController');
const authenticate = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// Public/Authenticated verify paper endpoint
router.get('/papers/:id/verify', authenticate, checkPaperIntegrity);

// Simulate byte corruption on paper payload (Admin & Controller for demo)
router.post('/papers/:id/simulate-tamper', authenticate, roleGuard(['ADMIN', 'CONTROLLER']), triggerSimulateTamper);

// Restore paper from vault backup
router.post('/papers/:id/restore-tamper', authenticate, roleGuard(['ADMIN', 'CONTROLLER']), triggerRestoreTamper);

// Get live security alerts
router.get('/alerts', authenticate, getSecurityAlerts);

module.exports = router;
