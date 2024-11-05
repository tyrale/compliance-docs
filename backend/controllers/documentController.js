const asyncHandler = require('express-async-handler');
const Document = require('../models/documentModel');
const { extractTextFromPDF } = require('../utils/pdfUtils');
const { generateSummary } = require('../utils/nlpUtils');
const { client: elasticClient } = require('../config/elasticsearch');
const fs = require('fs').promises;

// @desc    Get all documents
// @route   GET /api/documents
// @access  Public
exports.getDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find().sort({ createdAt: -1 });
  res.json(documents);
});

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Public
exports.getDocument = asyncHandler(async (req, res) => {
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
exports.createDocument = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a file');
    }

    const { originalname, path } = req.file;
    
    // Extract text from PDF
    let extractedText;
    try {
      extractedText = await extractTextFromPDF(path);
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      res.status(500);
      throw new Error('Error processing PDF file');
    }

    // Generate summary (this replaces processDocumentText)
    let processedContent;
    try {
      const summaryResult = await generateSummary(extractedText);
      processedContent = {
        fullText: extractedText,
        summary: summaryResult.summary
      };
    } catch (error) {
      console.error('Error processing document text:', error);
      // Continue with just the extracted text if summary fails
      processedContent = {
        fullText: extractedText,
        summary: ''
      };
    }

    // Create document in MongoDB
    const document = await Document.create({
      title: originalname,
      filePath: path,
      content: processedContent,
    });

    // Index in Elasticsearch (non-blocking)
    try {
      await elasticClient.index({
        index: 'documents',
        id: document._id.toString(),
        body: {
          title: document.title,
          content: processedContent.fullText,
          summary: processedContent.summary,
          createdAt: new Date()
        }
      });
    } catch (error) {
      // Log Elasticsearch error but don't fail the request
      console.error('Elasticsearch indexing error:', error);
    }

    res.status(201).json(document);
  } catch (error) {
    // Clean up uploaded file if document creation fails
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file after failed upload:', unlinkError);
      }
    }
    throw error;
  }
});

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Public
exports.updateDocument = asyncHandler(async (req, res) => {
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

  // Update Elasticsearch (non-blocking)
  try {
    await elasticClient.update({
      index: 'documents',
      id: document._id.toString(),
      body: {
        doc: {
          title: updatedDocument.title,
          content: updatedDocument.content.fullText,
          summary: updatedDocument.content.summary,
          updatedAt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Elasticsearch update error:', error);
  }

  res.json(updatedDocument);
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Public
exports.deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Delete the file from storage
  if (document.filePath) {
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  // Delete from Elasticsearch (non-blocking)
  try {
    await elasticClient.delete({
      index: 'documents',
      id: document._id.toString()
    });
  } catch (error) {
    console.error('Error deleting from Elasticsearch:', error);
  }

  // Delete the document from MongoDB
  await Document.deleteOne({ _id: document._id });

  res.json({ message: 'Document removed' });
});
