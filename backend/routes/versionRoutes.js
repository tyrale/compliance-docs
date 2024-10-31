const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable access to parent router params
const {
  createVersion,
  getVersions,
  getVersion,
  setCurrentVersion,
  compareVersions,
} = require('../controllers/versionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, upload.single('document'), createVersion)
  .get(protect, getVersions);

router.route('/compare')
  .get(protect, compareVersions);

router.route('/:versionId')
  .get(protect, getVersion);

router.route('/:versionId/current')
  .put(protect, setCurrentVersion);

module.exports = router;
