const asyncHandler = require('express-async-handler');
const { searchDocuments, searchSections } = require('../utils/searchUtils');
const SearchHistory = require('../models/searchHistoryModel');

// @desc    Search documents
// @route   GET /api/search/documents
// @access  Private
const searchDocumentsHandler = asyncHandler(async (req, res) => {
  const searchParams = {
    query: req.query.q,
    filters: {
      category: req.query.category,
      author: req.query.author,
    },
    dateRange: req.query.dateRange ? JSON.parse(req.query.dateRange) : null,
    sortBy: req.query.sortBy ? JSON.parse(req.query.sortBy) : null,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  };

  const results = await searchDocuments(searchParams, req.user._id);

  // Record search history
  await SearchHistory.create({
    user: req.user._id,
    query: searchParams.query,
    filters: searchParams.filters,
    resultType: 'Document',
    results: results.hits.map(hit => hit._id),
  });

  res.json(results);
});

// @desc    Search sections
// @route   GET /api/search/sections
// @access  Private
const searchSectionsHandler = asyncHandler(async (req, res) => {
  const searchParams = {
    query: req.query.q,
    filters: {
      documentId: req.query.documentId,
      level: req.query.level,
    },
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  };

  const results = await searchSections(searchParams, req.user._id);

  // Record search history
  await SearchHistory.create({
    user: req.user._id,
    query: searchParams.query,
    filters: searchParams.filters,
    resultType: 'Section',
    results: results.hits.map(hit => hit._id),
  });

  res.json(results);
});

// @desc    Get search history
// @route   GET /api/search/history
// @access  Private
const getSearchHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const history = await SearchHistory.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('results');

  const total = await SearchHistory.countDocuments({ user: req.user._id });

  res.json({
    history,
    page,
    limit,
    total,
  });
});

// @desc    Clear search history
// @route   DELETE /api/search/history
// @access  Private
const clearSearchHistory = asyncHandler(async (req, res) => {
  await SearchHistory.deleteMany({ user: req.user._id });
  res.json({ message: 'Search history cleared' });
});

module.exports = {
  searchDocumentsHandler,
  searchSectionsHandler,
  getSearchHistory,
  clearSearchHistory,
};
