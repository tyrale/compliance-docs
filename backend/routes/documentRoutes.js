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

// Import sub-routes
const annotationRoutes = require('./annotationRoutes');
const sectionRoutes = require('./sectionRoutes');
const versionRoutes = require('./versionRoutes');

// Use sub-routes
router.use('/:documentId/annotations', annotationRoutes);
router.use('/:documentId/sections', sectionRoutes);
router.use('/:documentId/versions', versionRoutes);

// Document routes
router
  .route('/')
  .post(protect, upload.single('file'), uploadDocument)
  .get(protect, getDocuments);

router
  .route('/:id')
  .get(protect, getDocumentById)
  .put(protect, updateDocument)
  .delete(protect, deleteDocument);

module.exports = router;
