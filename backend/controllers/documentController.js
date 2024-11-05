const asyncHandler = require('express-async-handler');
const Document = require('../models/documentModel');
const { extractText } = require('../utils/pdfUtils');
const path = require('path');
const fs = require('fs');

// @desc    Upload a document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    try {
        // Extract text from PDF
        const pdfText = await extractText(req.file.path);

        // Create document in database
        const document = await Document.create({
            title: req.file.originalname,
            filePath: req.file.path,
            content: pdfText,
            uploadedBy: req.user._id
        });

        res.status(201).json(document);
    } catch (error) {
        // Clean up uploaded file if there's an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(400);
        throw new Error('Error processing PDF file: ' + error.message);
    }
});

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
    const documents = await Document.find({ uploadedBy: req.user._id });
    res.json(documents);
});

// @desc    Get a single document
// @route   GET /api/documents/:id
// @access  Private
const getDocument = asyncHandler(async (req, res) => {
    const document = await Document.findById(req.params.id);

    if (!document) {
        res.status(404);
        throw new Error('Document not found');
    }

    // Check if user owns the document
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to access this document');
    }

    res.json(document);
});

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
    const document = await Document.findById(req.params.id);

    if (!document) {
        res.status(404);
        throw new Error('Document not found');
    }

    // Check if user owns the document
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this document');
    }

    try {
        // Delete file from filesystem if it exists
        if (document.filePath && fs.existsSync(document.filePath)) {
            fs.unlinkSync(document.filePath);
        }

        await document.deleteOne(); // Using deleteOne() instead of remove() as it's more modern

        res.json({ message: 'Document removed successfully' });
    } catch (error) {
        res.status(500);
        throw new Error('Error deleting document: ' + error.message);
    }
});

module.exports = {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument
};
