import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import documentReducer from '../../store/slices/documentSlice';
import Documents from '../../pages/Documents';
import DocumentView from '../../pages/DocumentView';

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      documents: documentReducer,
    },
  });
};

jest.mock('../../services/documentService', () => ({
  getDocuments: jest.fn(() => Promise.resolve({
    documents: [
      { _id: '1', title: 'Test Document 1', createdAt: new Date().toISOString() },
      { _id: '2', title: 'Test Document 2', createdAt: new Date().toISOString() }
    ]
  })),
  getDocument: jest.fn(() => Promise.resolve({
    document: {
      _id: '1',
      title: 'Test Document 1',
      content: 'Test content',
      createdAt: new Date().toISOString()
    }
  }))
}));

describe('Document Management Flow', () => {
  let store;

  beforeEach(() => {
    store = createTestStore();
  });

  test('displays document list and allows navigation to document view', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Documents />
        </BrowserRouter>
      </Provider>
    );

    // Wait for documents to load
    await waitFor(() => {
      expect(screen.getByText('Test Document 1')).toBeInTheDocument();
      expect(screen.getByText('Test Document 2')).toBeInTheDocument();
    });

    // Click on first document
    const firstDocument = screen.getByText('Test Document 1');
    fireEvent.click(firstDocument);

    // Verify navigation to document view
    expect(window.location.pathname).toMatch(/\/documents\/1/);
  });

  test('document view displays document details', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DocumentView />
        </BrowserRouter>
      </Provider>
    );

    // Wait for document to load
    await waitFor(() => {
      expect(screen.getByText('Test Document 1')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });
});
