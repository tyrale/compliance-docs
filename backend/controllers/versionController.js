const asyncHandler = require('express-async-handler');
const Document = require('../models/documentModel');
const Version = require('../models/versionModel');
const fs = require('fs').promises;
const path = require('path');

// @desc    Create new version of document
// @route   POST /api/documents/:documentId/versions
// @access  Private
const createVersion = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  const document = await Document.findById(req.params.documentId)
    .populate('versions');

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check permissions
  if (document.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to create new version');
  }

  // Create new version
  const versionNumber = document.versions.length + 1;
  const version = await Version.create({
    document: document._id,
    versionNumber,
    filePath: req.file.path,
    createdBy: req.user._id,
    changeLog: req.body.changeLog || `Version ${versionNumber}`,
    metadata: {
      fileSize: req.file.size,
      lastModified: new Date(),
    },
  });

  // Update document
  document.versions.push(version._id);
  document.currentVersion = version._id;
  document.metadata.lastModified = new Date();
  await document.save();

  res.status(201).json(version);
});

// @desc    Get all versions of a document
// @route   GET /api/documents/:documentId/versions
// @access  Private
const getVersions = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.documentId);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check permissions
  if (
    document.uploadedBy.toString() !== req.user._id.toString() &&
    !document.permissions.readAccess.includes(req.user._id)
  ) {
    res.status(403);
    throw new Error('Not authorized to view versions');
  }

  const versions = await Version.find({ document: req.params.documentId })
    .populate('createdBy', 'username')
    .sort({ versionNumber: -1 });

  res.json(versions);
});

// @desc    Get specific version of a document
// @route   GET /api/documents/:documentId/versions/:versionId
// @access  Private
const getVersion = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.documentId);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check permissions
  if (
    document.uploadedBy.toString() !== req.user._id.toString() &&
    !document.permissions.readAccess.includes(req.user._id)
  ) {
    res.status(403);
    throw new Error('Not authorized to view this version');
  }

  const version = await Version.findOne({
    _id: req.params.versionId,
    document: req.params.documentId,
  }).populate('createdBy', 'username');

  if (!version) {
    res.status(404);
    throw new Error('Version not found');
  }

  res.json(version);
});

// @desc    Get version file
// @route   GET /api/documents/:documentId/versions/:versionId/file
// @access  Private
const getVersionFile = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.documentId);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check permissions
  if (
    document.uploadedBy.toString() !== req.user._id.toString() &&
    !document.permissions.readAccess.includes(req.user._id)
  ) {
    res.status(403);
    throw new Error('Not authorized to view this version');
  }

  const version = await Version.findOne({
    _id: req.params.versionId,
    document: req.params.documentId,
  });

  if (!version) {
    res.status(404);
    throw new Error('Version not found');
  }

  // Send the file
  res.sendFile(path.resolve(version.filePath));
});

// @desc    Set specific version as current
// @route   PUT /api/documents/:documentId/versions/:versionId/current
// @access  Private
const setCurrentVersion = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.documentId);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check permissions
  if (document.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to modify this document');
  }

  const version = await Version.findOne({
    _id: req.params.versionId,
    document: req.params.documentId,
  });

  if (!version) {
    res.status(404);
    throw new Error('Version not found');
  }

  document.currentVersion = version._id;
  await document.save();

  res.json({ message: 'Current version updated' });
});

// @desc    Compare two versions
// @route   GET /api/documents/:documentId/versions/compare
// @access  Private
const compareVersions = asyncHandler(async (req, res) => {
  const { version1Id, version2Id } = req.query;

  if (!version1Id || !version2Id) {
    res.status(400);
    throw new Error('Please provide both version IDs for comparison');
  }

  const document = await Document.findById(req.params.documentId);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check permissions
  if (
    document.uploadedBy.toString() !== req.user._id.toString() &&
    !document.permissions.readAccess.includes(req.user._id)
  ) {
    res.status(403);
    throw new Error('Not authorized to compare versions');
  }

  const version1 = await Version.findById(version1Id);
  const version2 = await Version.findById(version2Id);

  if (!version1 || !version2) {
    res.status(404);
    throw new Error('One or both versions not found');
  }

  // Return metadata comparison (actual content comparison would be handled by frontend)
  res.json({
    version1: {
      versionNumber: version1.versionNumber,
      createdAt: version1.createdAt,
      changeLog: version1.changeLog,
      metadata: version1.metadata,
    },
    version2: {
      versionNumber: version2.versionNumber,
      createdAt: version2.createdAt,
      changeLog: version2.changeLog,
      metadata: version2.metadata,
    },
  });
});

module.exports = {
  createVersion,
  getVersions,
  getVersion,
  getVersionFile,
  setCurrentVersion,
  compareVersions,
};
