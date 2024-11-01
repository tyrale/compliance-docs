import searchReducer, {
  performSearch,
  getSearchHistory,
  saveSearch,
  getSuggestions,
  setSearchType,
  setSearchFilters,
  resetSearchState,
  clearSearchHistory,
} from '../searchSlice';
import * as searchService from '../../../services/searchService';

// Mock search service
jest.mock('../../../services/searchService');

describe('Search Slice', () => {
  const initialState = {
    results: {
      documents: [],
      sections: [],
    },
    searchHistory: [],
    suggestions: [],
    loading: false,
    error: null,
    searchType: 'documents',
    filters: {},
    pagination: {
      page: 1,
      totalPages: 1,
      total: 0,
    },
  };

  const mockSearchResults = {
    documents: [
      {
        _id: '1',
        title: 'Test Document',
        content: 'Test content',
        highlights: {
          content: ['Test <em>content</em>'],
        },
        score: 0.8,
      },
    ],
    sections: [
      {
        _id: 's1',
        documentId: '1',
        title: 'Test Section',
        content: 'Section content',
        highlights: {
          content: ['Section <em>content</em>'],
        },
      },
    ],
    total: 2,
    page: 1,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reducer', () => {
    it('should handle initial state', () => {
      expect(searchReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setSearchType', () => {
      const searchType = 'sections';
      const state = searchReducer(initialState, setSearchType(searchType));
      expect(state.searchType).toBe(searchType);
      expect(state.pagination.page).toBe(1);
    });

    it('should handle setSearchFilters', () => {
      const filters = {
        category: 'policy',
        dateRange: 'last-month',
      };
      const state = searchReducer(initialState, setSearchFilters(filters));
      expect(state.filters).toEqual(filters);
      expect(state.pagination.page).toBe(1);
    });

    it('should handle resetSearchState', () => {
      const state = {
        ...initialState,
        results: mockSearchResults,
        error: 'Test error',
      };
      expect(searchReducer(state, resetSearchState())).toEqual(initialState);
    });
  });

  describe('async thunks', () => {
    describe('performSearch', () => {
      const searchQuery = {
        query: 'test',
        page: 1,
        filters: { category: 'policy' },
      };

      it('should handle successful search', async () => {
        searchService.search.mockResolvedValueOnce(mockSearchResults);

        const dispatch = jest.fn();
        const thunk = performSearch(searchQuery);
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(performSearch.pending.type);
        expect(calls[1][0].type).toBe(performSearch.fulfilled.type);
        expect(calls[1][0].payload).toEqual(mockSearchResults);
      });

      it('should handle search failure', async () => {
        const error = new Error('Search failed');
        searchService.search.mockRejectedValueOnce(error);

        const dispatch = jest.fn();
        const thunk = performSearch(searchQuery);
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(performSearch.pending.type);
        expect(calls[1][0].type).toBe(performSearch.rejected.type);
        expect(calls[1][0].error.message).toBe('Search failed');
      });

      it('should handle section-based search', async () => {
        const sectionSearchQuery = {
          ...searchQuery,
          searchType: 'sections',
        };
        searchService.search.mockResolvedValueOnce(mockSearchResults);

        const dispatch = jest.fn();
        const thunk = performSearch(sectionSearchQuery);
        await thunk(dispatch);

        expect(searchService.search).toHaveBeenCalledWith(
          expect.objectContaining({
            searchType: 'sections',
          })
        );
      });
    });

    describe('search history', () => {
      const mockHistory = [
        {
          _id: 'h1',
          query: 'test',
          timestamp: '2023-01-01',
          filters: { category: 'policy' },
        },
      ];

      it('should handle getting search history', async () => {
        searchService.getSearchHistory.mockResolvedValueOnce(mockHistory);

        const dispatch = jest.fn();
        const thunk = getSearchHistory();
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(getSearchHistory.pending.type);
        expect(calls[1][0].type).toBe(getSearchHistory.fulfilled.type);
        expect(calls[1][0].payload).toEqual(mockHistory);
      });

      it('should handle saving search', async () => {
        const searchData = {
          query: 'test',
          filters: { category: 'policy' },
        };
        searchService.saveSearch.mockResolvedValueOnce(mockHistory[0]);

        const dispatch = jest.fn();
        const thunk = saveSearch(searchData);
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(saveSearch.pending.type);
        expect(calls[1][0].type).toBe(saveSearch.fulfilled.type);
        expect(calls[1][0].payload).toEqual(mockHistory[0]);
      });

      it('should handle clearing search history', async () => {
        searchService.clearSearchHistory.mockResolvedValueOnce({ message: 'History cleared' });

        const dispatch = jest.fn();
        const thunk = clearSearchHistory();
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(clearSearchHistory.pending.type);
        expect(calls[1][0].type).toBe(clearSearchHistory.fulfilled.type);
      });
    });

    describe('search suggestions', () => {
      it('should handle getting search suggestions', async () => {
        const suggestions = ['test', 'testing', 'tester'];
        searchService.getSuggestions.mockResolvedValueOnce(suggestions);

        const dispatch = jest.fn();
        const thunk = getSuggestions('test');
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(getSuggestions.pending.type);
        expect(calls[1][0].type).toBe(getSuggestions.fulfilled.type);
        expect(calls[1][0].payload).toEqual(suggestions);
      });
    });
  });

  describe('selectors', () => {
    it('should select search results', () => {
      const state = {
        search: {
          ...initialState,
          results: mockSearchResults,
        },
      };

      expect(state.search.results.documents).toEqual(mockSearchResults.documents);
      expect(state.search.results.sections).toEqual(mockSearchResults.sections);
    });

    it('should select search history', () => {
      const mockHistory = [{ query: 'test', timestamp: '2023-01-01' }];
      const state = {
        search: {
          ...initialState,
          searchHistory: mockHistory,
        },
      };

      expect(state.search.searchHistory).toEqual(mockHistory);
    });

    it('should select search type and filters', () => {
      const state = {
        search: {
          ...initialState,
          searchType: 'sections',
          filters: { category: 'policy' },
        },
      };

      expect(state.search.searchType).toBe('sections');
      expect(state.search.filters).toEqual({ category: 'policy' });
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const error = new Error('Network error');
      searchService.search.mockRejectedValueOnce(error);

      const dispatch = jest.fn();
      const thunk = performSearch({ query: 'test' });
      await thunk(dispatch);

      const { calls } = dispatch.mock;
      expect(calls[1][0].type).toBe(performSearch.rejected.type);
      expect(calls[1][0].error.message).toBe('Network error');
    });

    it('should handle invalid search parameters', async () => {
      const error = new Error('Invalid search parameters');
      searchService.search.mockRejectedValueOnce(error);

      const dispatch = jest.fn();
      const thunk = performSearch({ query: '' });
      await thunk(dispatch);

      const { calls } = dispatch.mock;
      expect(calls[1][0].type).toBe(performSearch.rejected.type);
      expect(calls[1][0].error.message).toBe('Invalid search parameters');
    });
  });

  describe('pagination', () => {
    it('should handle paginated search results', async () => {
      const paginatedResults = {
        ...mockSearchResults,
        page: 2,
        totalPages: 3,
        total: 25,
      };
      searchService.search.mockResolvedValueOnce(paginatedResults);

      const dispatch = jest.fn();
      const thunk = performSearch({ query: 'test', page: 2 });
      await thunk(dispatch);

      const { calls } = dispatch.mock;
      expect(calls[1][0].payload.page).toBe(2);
      expect(calls[1][0].payload.totalPages).toBe(3);
      expect(calls[1][0].payload.total).toBe(25);
    });
  });
});
