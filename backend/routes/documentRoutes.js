const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} = require('../controllers/documentController');

router.route('/')
  .get(getDocuments)
  .post(upload.single('file'), createDocument);

router.route('/:id')
  .get(getDocument)
  .put(updateDocument)
  .delete(deleteDocument);

module.exports = router;
