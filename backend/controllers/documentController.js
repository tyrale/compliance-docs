const asyncHandler = require('express-async-handler');
const Document = require('../models/documentModel');
const Version = require('../models/versionModel');
const Section = require('../models/sectionModel');
const fs = require('fs').promises;
const path = require('path');

// @desc    Upload a new document
// @route   POST /api/documents
// @access  Private
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  const { title } = req.body;
  if (!title) {
    res.status(400);
    throw new Error('Please provide a title for the document');
  }

  // Create document
  const document = await Document.create({
    title,
    fileName: req.file.filename,
    fileType: 'pdf',
    fileSize: req.file.size,
    uploadedBy: req.user._id,
    metadata: {
      author: req.user.username,
      createdDate: new Date(),
      lastModified: new Date(),
    },
  });

  // Create initial version
  const version = await Version.create({
    document: document._id,
    versionNumber: 1,
    filePath: req.file.path,
    createdBy: req.user._id,
    changeLog: 'Initial version',
    metadata: {
      fileSize: req.file.size,
      lastModified: new Date(),
    },
  });

  // Update document with version
  document.versions.push(version._id);
  document.currentVersion = version._id;
  await document.save();

  // Add fileUrl to response
  const documentObj = document.toObject();
  documentObj.fileUrl = `/uploads/${req.file.filename}`;

  res.status(201).json(documentObj);
});

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({
    $or: [
      { uploadedBy: req.user._id },
      { 'permissions.readAccess': req.user._id },
    ],
  })
    .populate('currentVersion')
    .populate('uploadedBy', 'username');

  // Add fileUrl to each document
  const documentsWithUrls = documents.map(doc => {
    const docObj = doc.toObject();
    if (doc.fileName) {
      docObj.fileUrl = `/uploads/${doc.fileName}`;
    }
    return docObj;
  });

  res.json(documentsWithUrls);
});

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Private
const getDocumentById = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id)
    .populate('versions')
    .populate('currentVersion')
    .populate('sections')
    .populate('uploadedBy', 'username');

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check permissions
  if (
    document.uploadedBy._id.toString() !== req.user._id.toString() &&
    !document.permissions.readAccess.includes(req.user._id)
  ) {
    res.status(403);
    throw new Error('Not authorized to access this document');
  }

  // Add fileUrl to response
  const documentObj = document.toObject();
  if (document.fileName) {
    documentObj.fileUrl = `/uploads/${document.fileName}`;
  }

  res.json(documentObj);
});

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check permissions
  if (document.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this document');
  }

  const updatedDocument = await Document.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title || document.title,
      'metadata.keywords': req.body.keywords || document.metadata.keywords,
      'metadata.category': req.body.category || document.metadata.category,
      'metadata.lastModified': new Date(),
    },
    { new: true }
  );

  // Add fileUrl to response
  const documentObj = updatedDocument.toObject();
  if (updatedDocument.fileName) {
    documentObj.fileUrl = `/uploads/${updatedDocument.fileName}`;
  }

  res.json(documentObj);
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check permissions
  if (document.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this document');
  }

  // Delete all versions' files
  const versions = await Version.find({ document: document._id });
  for (const version of versions) {
    try {
      await fs.unlink(version.filePath);
    } catch (error) {
      console.error(`Error deleting file: ${version.filePath}`, error);
    }
  }

  // Delete all related data
  await Version.deleteMany({ document: document._id });
  await Section.deleteMany({ document: document._id });
  await Document.deleteOne({ _id: document._id });  // Changed from document.remove()

  res.json({ message: 'Document removed' });
});

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
};
