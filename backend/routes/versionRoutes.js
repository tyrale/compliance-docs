const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable access to parent router params
const {
  createVersion,
  getVersions,
  getVersion,
  getVersionFile,
  setCurrentVersion,
  compareVersions,
} = require('../controllers/versionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, upload.single('file'), createVersion)
  .get(protect, getVersions);

router.route('/compare')
  .get(protect, compareVersions);

router.route('/:versionId')
  .get(protect, getVersion);

router.route('/:versionId/current')
  .put(protect, setCurrentVersion);

router.route('/:versionId/file')
  .get(protect, getVersionFile);

module.exports = router;
