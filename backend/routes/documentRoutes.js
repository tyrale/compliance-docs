const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} = require('../controllers/documentController');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '50000000') // Default 50MB
  }
});

router.route('/')
  .get(getDocuments)
  .post(upload.single('file'), createDocument);

router.route('/:id')
  .get(getDocument)
  .put(updateDocument)
  .delete(deleteDocument);

module.exports = router;
