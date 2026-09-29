const express = require('express');
const router = express.Router();

const { uploadPaper, getPapers, getPaperById } = require('../controllers/paperController');
const authenticate = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const { uploadPdf, validatePdfMagicBytes } = require('../middleware/fileUpload');

// All paper routes require authentication
router.use(authenticate);

// List papers (Filtered by user role)
router.get('/', getPapers);

// Get single paper details
router.get('/:id', getPaperById);

// Upload paper (Restricted to SETTER or ADMIN)
router.post(
  '/upload',
  roleGuard(['SETTER', 'ADMIN']),
  uploadPdf,
  validatePdfMagicBytes,
  uploadPaper
);

module.exports = router;
