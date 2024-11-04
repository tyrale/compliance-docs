const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const filetypes = /pdf/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Error: PDF files only!'));
};

// Configure multer with increased buffer size and timeout
const multerUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    fieldSize: 50 * 1024 * 1024, // Increased field size limit
  },
});

// Enhanced upload middleware with better error handling
const enhancedUpload = (req, res, next) => {
  multerUpload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message: 'File size too large. Maximum size is 50MB.'
        });
      }
      return res.status(400).json({
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(500).json({
        message: `Server error during upload: ${err.message}`
      });
    }
    
    // No error, continue
    next();
  });
};

module.exports = {
  enhancedUpload,
  multerUpload
};
