const multer = require('multer');

const MAX_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 25) * 1024 * 1024;

// Store uploads in RAM buffer so raw PDF is NEVER saved unencrypted to disk
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  // Validate MIME type
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Invalid file type. Only PDF files (.pdf) are permitted for examination papers.'), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter
});

/**
 * Middleware wrapper to validate PDF magic number header in RAM buffer
 */
function validatePdfMagicBytes(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No question paper PDF file uploaded.'
    });
  }

  const buffer = req.file.buffer;
  // Check for PDF magic header bytes "%PDF-"
  if (buffer.length < 5 || buffer.toString('utf8', 0, 5) !== '%PDF-') {
    return res.status(400).json({
      success: false,
      message: 'Security Validation Failed: File content does not match genuine PDF structure.'
    });
  }

  next();
}

module.exports = {
  uploadPdf: upload.single('paperFile'),
  validatePdfMagicBytes
};
