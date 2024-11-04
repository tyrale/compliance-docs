const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(protect, getDocuments)
  .post(protect, upload.single('file'), uploadDocument);

router.route('/:id')
  .get(protect, getDocumentById)
  .put(protect, updateDocument)
  .delete(protect, deleteDocument);

module.exports = router;
