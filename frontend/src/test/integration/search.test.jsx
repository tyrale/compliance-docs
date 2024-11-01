import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import searchReducer from '../../store/slices/searchSlice';
import Search from '../../pages/Search';

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      search: searchReducer,
    },
  });
};

jest.mock('../../services/searchService', () => ({
  searchDocuments: jest.fn(() => Promise.resolve({
    results: [
      { _id: '1', title: 'Test Document 1', highlight: { content: ['matching content'] } },
      { _id: '2', title: 'Test Document 2', highlight: { content: ['other matching content'] } }
    ]
  }))
}));

describe('Search Flow', () => {
  let store;

  beforeEach(() => {
    store = createTestStore();
  });

  test('performs search and displays results', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Search />
        </BrowserRouter>
      </Provider>
    );

    // Find search input and submit button
    const searchInput = screen.getByPlaceholderText(/search/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    // Perform search
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.click(searchButton);

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Test Document 1')).toBeInTheDocument();
      expect(screen.getByText('Test Document 2')).toBeInTheDocument();
      expect(screen.getByText('matching content')).toBeInTheDocument();
      expect(screen.getByText('other matching content')).toBeInTheDocument();
    });
  });

  test('displays no results message when search returns empty', async () => {
    // Override mock to return empty results
    require('../../services/searchService').searchDocuments.mockImplementationOnce(
      () => Promise.resolve({ results: [] })
    );

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Search />
        </BrowserRouter>
      </Provider>
    );

    // Perform search
    const searchInput = screen.getByPlaceholderText(/search/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    fireEvent.click(searchButton);

    // Check for no results message
    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });
  });
});
