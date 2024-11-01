const asyncHandler = require('express-async-handler');
const Section = require('../models/sectionModel');
const Document = require('../models/documentModel');
const { extractTextFromPDF } = require('../utils/pdfUtils');

// @desc    Create section
// @route   POST /api/documents/:documentId/sections
// @access  Private
const createSection = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { title, content, startPage, endPage } = req.body;

  // Validate input
  if (!title || !startPage || !endPage) {
    res.status(400);
    throw new Error('Please provide title, start page, and end page');
  }

  // Check if document exists
  const document = await Document.findById(documentId);
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check permissions
  if (document.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to create sections for this document');
  }

  // If content is not provided, try to extract it from PDF
  let sectionContent = content;
  if (!content) {
    try {
      sectionContent = await extractTextFromPDF(
        document.currentVersion.filePath,
        startPage,
        endPage
      );
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      sectionContent = '';
    }
  }

  const section = await Section.create({
    document: documentId,
    title,
    content: sectionContent,
    startPage,
    endPage,
    createdBy: req.user._id,
  });

  // Add section to document
  document.sections.push(section._id);
  await document.save();

  res.status(201).json(section);
});

// @desc    Get all sections for a document
// @route   GET /api/documents/:documentId/sections
// @access  Private
const getSections = asyncHandler(async (req, res) => {
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
    throw new Error('Not authorized to view sections');
  }

  const sections = await Section.find({ document: documentId })
    .sort({ startPage: 1 })
    .populate('createdBy', 'name');

  res.json(sections);
});

// @desc    Get section by ID
// @route   GET /api/documents/:documentId/sections/:id
// @access  Private
const getSectionById = asyncHandler(async (req, res) => {
  const { documentId, id } = req.params;

  const section = await Section.findOne({
    _id: id,
    document: documentId,
  }).populate('createdBy', 'name');

  if (!section) {
    res.status(404);
    throw new Error('Section not found');
  }

  // Check if user has access to the document
  const document = await Document.findById(documentId);
  if (
    document.uploadedBy.toString() !== req.user._id.toString() &&
    !document.permissions.readAccess.includes(req.user._id)
  ) {
    res.status(403);
    throw new Error('Not authorized to view this section');
  }

  res.json(section);
});

// @desc    Update section
// @route   PUT /api/documents/:documentId/sections/:id
// @access  Private
const updateSection = asyncHandler(async (req, res) => {
  const { documentId, id } = req.params;
  const { title, content, startPage, endPage } = req.body;

  const section = await Section.findOne({
    _id: id,
    document: documentId,
  });

  if (!section) {
    res.status(404);
    throw new Error('Section not found');
  }

  // Check if user has permission to update
  const document = await Document.findById(documentId);
  if (document.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this section');
  }

  // Update section
  section.title = title || section.title;
  section.content = content || section.content;
  section.startPage = startPage || section.startPage;
  section.endPage = endPage || section.endPage;
  section.lastModified = Date.now();

  const updatedSection = await section.save();
  await updatedSection.populate('createdBy', 'name');

  res.json(updatedSection);
});

// @desc    Delete section
// @route   DELETE /api/documents/:documentId/sections/:id
// @access  Private
const deleteSection = asyncHandler(async (req, res) => {
  const { documentId, id } = req.params;

  const section = await Section.findOne({
    _id: id,
    document: documentId,
  });

  if (!section) {
    res.status(404);
    throw new Error('Section not found');
  }

  // Check if user has permission to delete
  const document = await Document.findById(documentId);
  if (document.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this section');
  }

  // Remove section from document
  document.sections = document.sections.filter(
    (sectionId) => sectionId.toString() !== id
  );
  await document.save();

  await section.remove();

  res.json({ message: 'Section removed' });
});

// @desc    Generate section summary
// @route   POST /api/documents/:documentId/sections/:id/summary
// @access  Private
const generateSectionSummary = asyncHandler(async (req, res) => {
  const { documentId, id } = req.params;

  const section = await Section.findOne({
    _id: id,
    document: documentId,
  });

  if (!section) {
    res.status(404);
    throw new Error('Section not found');
  }

  // Check permissions
  const document = await Document.findById(documentId);
  if (
    document.uploadedBy.toString() !== req.user._id.toString() &&
    !document.permissions.readAccess.includes(req.user._id)
  ) {
    res.status(403);
    throw new Error('Not authorized to generate summary for this section');
  }

  // Generate summary using NLP or AI service
  // This is a placeholder - implement actual summary generation
  const summary = section.content
    ? section.content.substring(0, 200) + '...'
    : 'Summary not available';

  section.summary = summary;
  await section.save();

  res.json({ summary });
});

module.exports = {
  createSection,
  getSections,
  getSectionById,
  updateSection,
  deleteSection,
  generateSectionSummary,
};