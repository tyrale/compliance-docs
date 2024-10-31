const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable access to parent router params
const {
  createSection,
  getSections,
  getSectionById,
  updateSection,
  deleteSection,
  generateSectionSummary,
} = require('../controllers/sectionController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected and prefixed with /api/documents/:documentId/sections
router.use(protect);

router
  .route('/')
  .post(createSection)
  .get(getSections);

router
  .route('/:id')
  .get(getSectionById)
  .put(updateSection)
  .delete(deleteSection);

router.post('/:id/summary', generateSectionSummary);

module.exports = router;
