const asyncHandler = require('express-async-handler');
const Document = require('../models/documentModel');
const { extractTextFromPDF } = require('../utils/pdfUtils');
const { processDocumentText } = require('../utils/nlpUtils');

// @desc    Get all documents
// @route   GET /api/documents
// @access  Public
const getDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find().sort({ createdAt: -1 });
  res.json(documents);
});

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Public
const getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }
  res.json(document);
});

// @desc    Create document
// @route   POST /api/documents
// @access  Public
const createDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  const { originalname, path } = req.file;
  const extractedText = await extractTextFromPDF(path);
  const processedContent = await processDocumentText(extractedText);

  const document = await Document.create({
    title: originalname,
    filePath: path,
    content: processedContent,
  });

  res.status(201).json(document);
});

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Public
const updateDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  const updatedDocument = await Document.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updatedDocument);
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Public
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  await document.remove();
  res.json({ message: 'Document removed' });
});

module.exports = {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
};
