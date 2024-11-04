import api from './api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handleRequest = async (requestFn) => {
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error) {
      attempt++;
      
      // If we've exhausted all retries, throw the error
      if (attempt === MAX_RETRIES) {
        throw error;
      }

      // If it's a timeout or network error, wait and retry
      if (error.code === 'ECONNABORTED' || error.message.includes('network')) {
        await sleep(RETRY_DELAY);
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }
};

const searchService = {
  // Basic search
  search: async (query, filters = {}, page = 1, limit = 10) => {
    return handleRequest(() => 
      api.get('/search', {
        params: {
          query,
          page,
          limit,
          ...filters,
        },
      })
    );
  },

  // Advanced search with specific filters
  advancedSearch: async (searchParams) => {
    return handleRequest(() => 
      api.post('/search/advanced', searchParams)
    );
  },

  // Section-based search
  searchSections: async (query, filters = {}) => {
    return handleRequest(() => 
      api.get('/search/sections', {
        params: {
          query,
          ...filters,
        },
      })
    );
  },

  // Search history
  getSearchHistory: async () => {
    return handleRequest(() => 
      api.get('/search/history')
    );
  },

  // Search analytics
  getSearchAnalytics: async (timeRange) => {
    return handleRequest(() => 
      api.get('/search/analytics', {
        params: timeRange,
      })
    );
  },

  // Save search query
  saveSearch: async (searchData) => {
    return handleRequest(() => 
      api.post('/search/save', searchData)
    );
  },

  // Get saved searches
  getSavedSearches: async () => {
    return handleRequest(() => 
      api.get('/search/saved')
    );
  },

  // Delete saved search
  deleteSavedSearch: async (searchId) => {
    return handleRequest(() => 
      api.delete(`/search/saved/${searchId}`)
    );
  },
};

export default searchService;
