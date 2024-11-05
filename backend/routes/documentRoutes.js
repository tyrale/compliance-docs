const express = require('express');
const router = express.Router();
const {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument
} = require('../controllers/documentController');
const upload = require('../middleware/uploadMiddleware');
const { devAuth } = require('../middleware/devAuthMiddleware');

// Apply dev auth middleware to all routes
router.use(devAuth);

// Document routes
router.post('/', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
