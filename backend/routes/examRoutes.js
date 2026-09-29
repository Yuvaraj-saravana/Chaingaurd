const express = require('express');
const router = express.Router();

const { 
  createExam, 
  getExams, 
  getExamById, 
  linkPaperToExam, 
  updateExamStatus 
} = require('../controllers/examController');

const authenticate = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// All exam routes require authentication
router.use(authenticate);

// List all exam sessions
router.get('/', getExams);

// Get single exam details
router.get('/:id', getExamById);

// Create new exam schedule (CONTROLLER or ADMIN)
router.post('/', roleGuard(['CONTROLLER', 'ADMIN']), createExam);

// Link approved paper to exam session
router.post('/:id/link-paper', roleGuard(['CONTROLLER', 'ADMIN']), linkPaperToExam);

// Update exam status
router.put('/:id/status', roleGuard(['CONTROLLER', 'ADMIN']), updateExamStatus);

module.exports = router;
