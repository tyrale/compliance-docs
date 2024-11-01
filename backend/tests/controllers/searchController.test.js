const {
  createTestUser,
  createTestDocument,
  mockRequest,
  mockResponse,
} = require('../utils/testHelpers');
const {
  searchDocuments,
  searchSections,
  getSearchHistory,
  saveSearch,
} = require('../../controllers/searchController');
const Document = require('../../models/documentModel');
const Section = require('../../models/sectionModel');
const SearchHistory = require('../../models/searchHistoryModel');
const elasticClient = require('../../config/elasticsearch');

// Mock Elasticsearch client
jest.mock('../../config/elasticsearch', () => ({
  search: jest.fn(),
  index: jest.fn(),
  bulk: jest.fn(),
  suggest: jest.fn(),
}));

describe('Search Controller', () => {
  let user;
  let document1;
  let document2;

  beforeEach(async () => {
    await Document.deleteMany({});
    await Section.deleteMany({});
    await SearchHistory.deleteMany({});

    // Reset all mocks
    jest.clearAllMocks();

    user = await createTestUser();
    document1 = await createTestDocument(user, {
      title: 'Compliance Policy 2023',
      metadata: {
        keywords: ['compliance', 'policy', '2023'],
        category: 'policy',
      },
    });
    document2 = await createTestDocument(user, {
      title: 'Security Guidelines',
      metadata: {
        keywords: ['security', 'guidelines'],
        category: 'guidelines',
      },
    });
  });

  describe('searchDocuments', () => {
    it('should search documents with basic query', async () => {
      const mockElasticResults = {
        hits: {
          total: { value: 1 },
          hits: [{
            _source: {
              id: document1._id.toString(),
              title: document1.title,
              content: 'Test content',
            },
            _score: 1.0,
          }],
        },
      };

      elasticClient.search.mockResolvedValue(mockElasticResults);

      const req = mockRequest({
        user: { _id: user._id },
        query: {
          q: 'compliance',
        },
      });
      const res = mockResponse();

      await searchDocuments(req, res);

      expect(elasticClient.search).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              title: 'Compliance Policy 2023',
            }),
          ]),
          total: 1,
        })
      );
    });

    it('should apply filters in search', async () => {
      const mockElasticResults = {
        hits: {
          total: { value: 1 },
          hits: [{
            _source: {
              id: document1._id.toString(),
              title: document1.title,
              category: 'policy',
            },
            _score: 1.0,
          }],
        },
      };

      elasticClient.search.mockResolvedValue(mockElasticResults);

      const req = mockRequest({
        user: { _id: user._id },
        query: {
          q: 'compliance',
          category: 'policy',
          dateFrom: '2023-01-01',
          dateTo: '2023-12-31',
        },
      });
      const res = mockResponse();

      await searchDocuments(req, res);

      expect(elasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.any(Object),
            filter: expect.any(Array),
          }),
        })
      );
    });

    it('should handle search errors', async () => {
      elasticClient.search.mockRejectedValue(new Error('Elasticsearch error'));

      const req = mockRequest({
        user: { _id: user._id },
        query: {
          q: 'compliance',
        },
      });
      const res = mockResponse();

      await searchDocuments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    // New test cases for advanced features
    it('should handle advanced search operators', async () => {
      const mockElasticResults = {
        hits: {
          total: { value: 1 },
          hits: [{
            _source: {
              id: document1._id.toString(),
              title: document1.title,
              content: 'Test content',
            },
            _score: 1.0,
          }],
        },
      };

      elasticClient.search.mockResolvedValue(mockElasticResults);

      const req = mockRequest({
        user: { _id: user._id },
        query: {
          q: 'title:"Compliance Policy" AND category:policy',
        },
      });
      const res = mockResponse();

      await searchDocuments(req, res);

      expect(elasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              query_string: expect.objectContaining({
                query: 'title:"Compliance Policy" AND category:policy',
              }),
            }),
          }),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      const mockElasticResults = {
        hits: {
          total: { value: 15 },
          hits: Array(5).fill({
            _source: {
              id: document1._id.toString(),
              title: document1.title,
              content: 'Test content',
            },
            _score: 1.0,
          }),
        },
      };

      elasticClient.search.mockResolvedValue(mockElasticResults);

      const req = mockRequest({
        user: { _id: user._id },
        query: {
          q: 'compliance',
          page: 2,
          limit: 5,
        },
      });
      const res = mockResponse();

      await searchDocuments(req, res);

      expect(elasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            from: 5,
            size: 5,
          }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.any(Array),
          total: 15,
          page: 2,
          totalPages: 3,
        })
      );
    });

    it('should handle sorting options', async () => {
      const mockElasticResults = {
        hits: {
          total: { value: 2 },
          hits: [{
            _source: {
              id: document1._id.toString(),
              title: document1.title,
              createdAt: '2023-01-01',
            },
            _score: null,
          }],
        },
      };

      elasticClient.search.mockResolvedValue(mockElasticResults);

      const req = mockRequest({
        user: { _id: user._id },
        query: {
          q: 'compliance',
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });
      const res = mockResponse();

      await searchDocuments(req, res);

      expect(elasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            sort: [{
              createdAt: { order: 'desc' },
            }],
          }),
        })
      );
    });

    it('should handle invalid search parameters', async () => {
      const req = mockRequest({
        user: { _id: user._id },
        query: {
          q: '',  // Empty search query
          page: 'invalid',
          limit: 'invalid',
        },
      });
      const res = mockResponse();

      await searchDocuments(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });
  });

  describe('searchSections', () => {
    it('should search within document sections', async () => {
      const mockElasticResults = {
        hits: {
          total: { value: 1 },
          hits: [{
            _source: {
              id: 'section1',
              documentId: document1._id.toString(),
              title: 'Section 1',
              content: 'Test content',
            },
            _score: 1.0,
          }],
        },
      };

      elasticClient.search.mockResolvedValue(mockElasticResults);

      const req = mockRequest({
        user: { _id: user._id },
        query: {
          q: 'test content',
          documentId: document1._id.toString(),
        },
      });
      const res = mockResponse();

      await searchSections(req, res);

      expect(elasticClient.search).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              title: 'Section 1',
            }),
          ]),
        })
      );
    });

    // New test for section search with highlighting
    it('should return highlighted matches in section search', async () => {
      const mockElasticResults = {
        hits: {
          total: { value: 1 },
          hits: [{
            _source: {
              id: 'section1',
              documentId: document1._id.toString(),
              title: 'Section 1',
              content: 'Test content with important information',
            },
            highlight: {
              content: ['Test content with <em>important</em> information'],
            },
            _score: 1.0,
          }],
        },
      };

      elasticClient.search.mockResolvedValue(mockElasticResults);

      const req = mockRequest({
        user: { _id: user._id },
        query: {
          q: 'important',
          documentId: document1._id.toString(),
        },
      });
      const res = mockResponse();

      await searchSections(req, res);

      expect(elasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            highlight: expect.objectContaining({
              fields: {
                content: {},
              },
            }),
          }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              highlight: expect.objectContaining({
                content: expect.arrayContaining([
                  expect.stringContaining('<em>important</em>'),
                ]),
              }),
            }),
          ]),
        })
      );
    });
  });

  describe('Search History', () => {
    it('should save search query to history', async () => {
      const req = mockRequest({
        user: { _id: user._id },
        body: {
          query: 'compliance policy',
          filters: {
            category: 'policy',
          },
        },
      });
      const res = mockResponse();

      await saveSearch(req, res);

      const searchHistory = await SearchHistory.findOne({
        user: user._id,
        query: 'compliance policy',
      });

      expect(searchHistory).toBeTruthy();
      expect(searchHistory.filters).toEqual(
        expect.objectContaining({
          category: 'policy',
        })
      );
    });

    it('should get user search history', async () => {
      // Create some search history entries
      await SearchHistory.create([
        {
          user: user._id,
          query: 'compliance',
          timestamp: new Date(),
        },
        {
          user: user._id,
          query: 'security',
          timestamp: new Date(),
        },
      ]);

      const req = mockRequest({
        user: { _id: user._id },
      });
      const res = mockResponse();

      await getSearchHistory(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            query: 'compliance',
          }),
          expect.objectContaining({
            query: 'security',
          }),
        ])
      );
    });

    it('should limit search history results', async () => {
      // Create multiple search history entries
      const searches = Array.from({ length: 15 }, (_, i) => ({
        user: user._id,
        query: `search ${i}`,
        timestamp: new Date(),
      }));
      await SearchHistory.create(searches);

      const req = mockRequest({
        user: { _id: user._id },
        query: { limit: 10 },
      });
      const res = mockResponse();

      await getSearchHistory(req, res);

      expect(res.json.mock.calls[0][0]).toHaveLength(10);
    });

    // New test for search history aggregation
    it('should aggregate search history statistics', async () => {
      // Create search history with repeated queries
      await SearchHistory.create([
        {
          user: user._id,
          query: 'compliance',
          timestamp: new Date(),
        },
        {
          user: user._id,
          query: 'compliance',
          timestamp: new Date(),
        },
        {
          user: user._id,
          query: 'security',
          timestamp: new Date(),
        },
      ]);

      const req = mockRequest({
        user: { _id: user._id },
        query: { stats: true },
      });
      const res = mockResponse();

      await getSearchHistory(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          topQueries: expect.arrayContaining([
            expect.objectContaining({
              query: 'compliance',
              count: 2,
            }),
          ]),
        })
      );
    });
  });
});
