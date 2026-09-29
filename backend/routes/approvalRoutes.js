const express = require('express');
const router = express.Router({ mergeParams: true });

const { 
  submitForReview, 
  reviewerApprove, 
  controllerApprove, 
  getApprovalHistory 
} = require('../controllers/approvalController');

const authenticate = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// All approval routes require authentication
router.use(authenticate);

// Submit paper for review (SETTER)
router.post('/submit', roleGuard(['SETTER', 'ADMIN']), submitForReview);

// Moderator / Reviewer approval (REVIEWER)
router.post('/review', roleGuard(['REVIEWER', 'ADMIN']), reviewerApprove);

// Exam Controller final approval (CONTROLLER)
router.post('/controller-approve', roleGuard(['CONTROLLER', 'ADMIN']), controllerApprove);

// Get approval audit history
router.get('/approvals', getApprovalHistory);

module.exports = router;
