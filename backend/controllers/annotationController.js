const asyncHandler = require('express-async-handler');
const Annotation = require('../models/annotationModel');
const Document = require('../models/documentModel');

// @desc    Create annotation
// @route   POST /api/documents/:documentId/annotations
// @access  Private
const createAnnotation = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { text, page, position } = req.body;

  // Validate input
  if (!text || !page || !position) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if document exists
  const document = await Document.findById(documentId);
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
    throw new Error('Not authorized to annotate this document');
  }

  const annotation = await Annotation.create({
    document: documentId,
    user: req.user._id,
    text,
    page,
    position,
  });

  // Add annotation to document
  document.annotations.push(annotation._id);
  await document.save();

  await annotation.populate('user', 'name email');

  res.status(201).json(annotation);
});

// @desc    Get all annotations for a document
// @route   GET /api/documents/:documentId/annotations
// @access  Private
const getAnnotations = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  // Check if document exists and user has access
  const document = await Document.findById(documentId);
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  if (
    document.uploadedBy.toString() !== req.user._id.toString() &&
    !document.permissions.readAccess.includes(req.user._id)
  ) {
    res.status(403);
    throw new Error('Not authorized to view annotations');
  }

  const annotations = await Annotation.find({ document: documentId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  res.json(annotations);
});

// @desc    Update annotation
// @route   PUT /api/documents/:documentId/annotations/:id
// @access  Private
const updateAnnotation = asyncHandler(async (req, res) => {
  const { documentId, id } = req.params;
  const { text } = req.body;

  const annotation = await Annotation.findOne({
    _id: id,
    document: documentId,
  });

  if (!annotation) {
    res.status(404);
    throw new Error('Annotation not found');
  }

  // Check if user owns the annotation
  if (annotation.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this annotation');
  }

  annotation.text = text || annotation.text;
  annotation.lastModified = Date.now();

  const updatedAnnotation = await annotation.save();
  await updatedAnnotation.populate('user', 'name email');

  res.json(updatedAnnotation);
});

// @desc    Delete annotation
// @route   DELETE /api/documents/:documentId/annotations/:id
// @access  Private
const deleteAnnotation = asyncHandler(async (req, res) => {
  const { documentId, id } = req.params;

  const annotation = await Annotation.findOne({
    _id: id,
    document: documentId,
  });

  if (!annotation) {
    res.status(404);
    throw new Error('Annotation not found');
  }

  // Check if user owns the annotation
  if (annotation.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this annotation');
  }

  // Remove annotation from document
  const document = await Document.findById(documentId);
  document.annotations = document.annotations.filter(
    (annotationId) => annotationId.toString() !== id
  );
  await document.save();

  await annotation.remove();

  res.json({ message: 'Annotation removed' });
});

// @desc    Get annotation by ID
// @route   GET /api/documents/:documentId/annotations/:id
// @access  Private
const getAnnotationById = asyncHandler(async (req, res) => {
  const { documentId, id } = req.params;

  const annotation = await Annotation.findOne({
    _id: id,
    document: documentId,
  }).populate('user', 'name email');

  if (!annotation) {
    res.status(404);
    throw new Error('Annotation not found');
  }

  // Check if user has access to the document
  const document = await Document.findById(documentId);
  if (
    document.uploadedBy.toString() !== req.user._id.toString() &&
    !document.permissions.readAccess.includes(req.user._id)
  ) {
    res.status(403);
    throw new Error('Not authorized to view this annotation');
  }

  res.json(annotation);
});

module.exports = {
  createAnnotation,
  getAnnotations,
  updateAnnotation,
  deleteAnnotation,
  getAnnotationById,
};
