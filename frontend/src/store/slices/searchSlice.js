import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  searchResults: [],
  searchHistory: [],
  filters: {
    dateRange: null,
    documentTypes: [],
    sections: [],
  },
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  resultsPerPage: 10,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload.results;
      state.totalPages = Math.ceil(action.payload.total / state.resultsPerPage);
      state.loading = false;
    },
    addToSearchHistory: (state, action) => {
      state.searchHistory = [action.payload, ...state.searchHistory].slice(0, 10);
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setResultsPerPage: (state, action) => {
      state.resultsPerPage = action.payload;
      state.totalPages = Math.ceil(
        state.searchResults.length / action.payload
      );
    },
    clearSearchState: (state) => {
      return { ...initialState, searchHistory: state.searchHistory };
    },
  },
});

export const {
  setLoading,
  setError,
  setSearchResults,
  addToSearchHistory,
  setFilters,
  clearFilters,
  setCurrentPage,
  setResultsPerPage,
  clearSearchState,
} = searchSlice.actions;

export default searchSlice.reducer;
