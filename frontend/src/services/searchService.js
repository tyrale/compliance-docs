import api from './api';

const searchService = {
  // Basic search
  search: async (query, filters = {}, page = 1, limit = 10) => {
    const response = await api.get('/search', {
      params: {
        query,
        page,
        limit,
        ...filters,
      },
    });
    return response.data;
  },

  // Advanced search with specific filters
  advancedSearch: async (searchParams) => {
    const response = await api.post('/search/advanced', searchParams);
    return response.data;
  },

  // Section-based search
  searchSections: async (query, filters = {}) => {
    const response = await api.get('/search/sections', {
      params: {
        query,
        ...filters,
      },
    });
    return response.data;
  },

  // Search history
  getSearchHistory: async () => {
    const response = await api.get('/search/history');
    return response.data;
  },

  // Search analytics
  getSearchAnalytics: async (timeRange) => {
    const response = await api.get('/search/analytics', {
      params: timeRange,
    });
    return response.data;
  },

  // Save search query
  saveSearch: async (searchData) => {
    const response = await api.post('/search/save', searchData);
    return response.data;
  },

  // Get saved searches
  getSavedSearches: async () => {
    const response = await api.get('/search/saved');
    return response.data;
  },

  // Delete saved search
  deleteSavedSearch: async (searchId) => {
    const response = await api.delete(`/search/saved/${searchId}`);
    return response.data;
  },
};

export default searchService;
