const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable access to parent router params
const {
  createAnnotation,
  getAnnotations,
  updateAnnotation,
  deleteAnnotation,
  getAnnotationById,
} = require('../controllers/annotationController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected and prefixed with /api/documents/:documentId/annotations
router.use(protect);

router
  .route('/')
  .post(createAnnotation)
  .get(getAnnotations);

router
  .route('/:id')
  .get(getAnnotationById)
  .put(updateAnnotation)
  .delete(deleteAnnotation);

module.exports = router;
