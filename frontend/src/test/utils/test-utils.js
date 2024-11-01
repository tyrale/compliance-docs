import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import authReducer from '../../store/slices/authSlice';
import documentReducer from '../../store/slices/documentSlice';
import searchReducer from '../../store/slices/searchSlice';

function render(
  ui,
  {
    preloadedState,
    store = configureStore({
      reducer: {
        auth: authReducer,
        documents: documentReducer,
        search: searchReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { render };

// Common test data
export const mockUser = {
  _id: '123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
};

export const mockDocument = {
  _id: '456',
  title: 'Test Document',
  uploadedBy: mockUser._id,
  fileName: 'test.pdf',
  createdAt: new Date().toISOString(),
  metadata: {
    category: 'test',
    tags: ['test'],
  },
};

// Mock API responses
export const mockApiResponse = {
  success: (data) => ({
    status: 200,
    ok: true,
    json: () => Promise.resolve(data),
  }),
  error: (status = 400, message = 'Error') => ({
    status,
    ok: false,
    json: () => Promise.resolve({ message }),
  }),
};

// Mock store actions
export const mockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      documents: documentReducer,
      search: searchReducer,
    },
    preloadedState: initialState,
  });
};

// Mock file data
export const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

// Mock router context
export const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
