const express = require('express');
const router = express.Router();
const {
  searchDocumentsHandler,
  searchSectionsHandler,
  getSearchHistory,
  clearSearchHistory,
} = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/documents', protect, searchDocumentsHandler);
router.get('/sections', protect, searchSectionsHandler);
router.route('/history')
  .get(protect, getSearchHistory)
  .delete(protect, clearSearchHistory);

module.exports = router;
