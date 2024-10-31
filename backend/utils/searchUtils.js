const { client } = require('../config/elasticsearch');

// Index a document in Elasticsearch
const indexDocument = async (document) => {
  try {
    await client.index({
      index: 'documents',
      id: document._id.toString(),
      body: {
        title: document.title,
        content: '', // Will be updated when content is extracted
        metadata: document.metadata,
        uploadedBy: document.uploadedBy.toString(),
        permissions: {
          readAccess: document.permissions.readAccess.map(id => id.toString()),
          writeAccess: document.permissions.writeAccess.map(id => id.toString()),
        },
      },
    });
  } catch (error) {
    console.error('Error indexing document:', error);
    throw error;
  }
};

// Index a section in Elasticsearch
const indexSection = async (section) => {
  try {
    await client.index({
      index: 'sections',
      id: section._id.toString(),
      body: {
        documentId: section.document.toString(),
        title: section.title,
        content: section.content,
        summary: section.summary,
        pageNumber: section.pageNumber,
        metadata: section.metadata,
      },
    });
  } catch (error) {
    console.error('Error indexing section:', error);
    throw error;
  }
};

// Build search query based on parameters
const buildSearchQuery = (searchParams, userId) => {
  const {
    query,
    filters = {},
    dateRange,
    sortBy,
    page = 1,
    limit = 10,
  } = searchParams;

  // Base query
  const baseQuery = {
    bool: {
      must: [
        query ? {
          multi_match: {
            query,
            fields: ['title^2', 'content', 'metadata.keywords'],
            fuzziness: 'AUTO',
          },
        } : { match_all: {} },
      ],
      filter: [
        {
          bool: {
            should: [
              { term: { uploadedBy: userId } },
              { terms: { 'permissions.readAccess': [userId] } },
            ],
          },
        },
      ],
    },
  };

  // Add filters
  if (filters.category) {
    baseQuery.bool.filter.push({
      term: { 'metadata.category': filters.category },
    });
  }

  if (filters.author) {
    baseQuery.bool.filter.push({
      term: { 'metadata.author': filters.author },
    });
  }

  if (dateRange) {
    baseQuery.bool.filter.push({
      range: {
        'metadata.createdDate': {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });
  }

  // Build sort
  const sort = [];
  if (sortBy) {
    sort.push({ [sortBy.field]: { order: sortBy.order || 'desc' } });
  }

  return {
    from: (page - 1) * limit,
    size: limit,
    query: baseQuery,
    sort,
  };
};

// Search documents
const searchDocuments = async (searchParams, userId) => {
  try {
    const query = buildSearchQuery(searchParams, userId);
    const response = await client.search({
      index: 'documents',
      body: query,
    });

    return {
      hits: response.hits.hits.map(hit => ({
        _id: hit._id,
        _score: hit._score,
        ...hit._source,
      })),
      total: response.hits.total.value,
      page: searchParams.page || 1,
      limit: searchParams.limit || 10,
    };
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

// Search sections
const searchSections = async (searchParams, userId) => {
  try {
    const query = buildSearchQuery(searchParams, userId);
    const response = await client.search({
      index: 'sections',
      body: query,
    });

    return {
      hits: response.hits.hits.map(hit => ({
        _id: hit._id,
        _score: hit._score,
        ...hit._source,
      })),
      total: response.hits.total.value,
      page: searchParams.page || 1,
      limit: searchParams.limit || 10,
    };
  } catch (error) {
    console.error('Error searching sections:', error);
    throw error;
  }
};

module.exports = {
  indexDocument,
  indexSection,
  searchDocuments,
  searchSections,
};
