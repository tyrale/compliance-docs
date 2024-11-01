import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test/utils/test-utils';
import { useNavigate } from 'react-router-dom';
import Documents from '../Documents';
import * as documentService from '../../services/documentService';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

// Mock document service
jest.mock('../../services/documentService');

describe('Documents', () => {
  const navigate = jest.fn();
  const mockDocuments = [
    {
      _id: '1',
      title: 'Document 1',
      uploadedBy: 'user1',
      createdAt: '2023-01-01',
      metadata: {
        category: 'policy',
        tags: ['compliance'],
      },
    },
    {
      _id: '2',
      title: 'Document 2',
      uploadedBy: 'user1',
      createdAt: '2023-01-02',
      metadata: {
        category: 'guidelines',
        tags: ['security'],
      },
    },
  ];

  beforeEach(() => {
    useNavigate.mockReturnValue(navigate);
    documentService.getDocuments.mockResolvedValue(mockDocuments);
    jest.clearAllMocks();
  });

  it('renders document list', async () => {
    render(<Documents />);

    await waitFor(() => {
      expect(screen.getByText('Document 1')).toBeInTheDocument();
      expect(screen.getByText('Document 2')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    documentService.getDocuments.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<Documents />);

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('handles document upload', async () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const mockUploadedDoc = {
      _id: '3',
      title: 'Test Document',
      fileName: 'test.pdf',
    };

    documentService.uploadDocument.mockResolvedValueOnce(mockUploadedDoc);

    render(<Documents />);

    const fileInput = screen.getByTestId('file-upload');
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(documentService.uploadDocument).toHaveBeenCalledWith(
        expect.any(FormData)
      );
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
  });

  it('handles document deletion', async () => {
    documentService.getDocuments.mockResolvedValueOnce(mockDocuments);
    documentService.deleteDocument.mockResolvedValueOnce({ message: 'Document deleted' });

    render(<Documents />);

    await waitFor(() => {
      expect(screen.getByText('Document 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getAllByTestId('delete-document')[0];
    fireEvent.click(deleteButton);

    // Confirm deletion
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(documentService.deleteDocument).toHaveBeenCalledWith('1');
      expect(screen.queryByText('Document 1')).not.toBeInTheDocument();
    });
  });

  it('navigates to document view on click', async () => {
    render(<Documents />);

    await waitFor(() => {
      expect(screen.getByText('Document 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Document 1'));

    expect(navigate).toHaveBeenCalledWith('/documents/1');
  });

  it('filters documents by category', async () => {
    render(<Documents />);

    await waitFor(() => {
      expect(screen.getByText('Document 1')).toBeInTheDocument();
    });

    const categoryFilter = screen.getByLabelText(/category/i);
    fireEvent.change(categoryFilter, { target: { value: 'policy' } });

    await waitFor(() => {
      expect(screen.getByText('Document 1')).toBeInTheDocument();
      expect(screen.queryByText('Document 2')).not.toBeInTheDocument();
    });
  });

  it('sorts documents by date', async () => {
    render(<Documents />);

    await waitFor(() => {
      expect(screen.getByText('Document 1')).toBeInTheDocument();
    });

    const sortSelect = screen.getByLabelText(/sort by/i);
    fireEvent.change(sortSelect, { target: { value: 'createdAt_desc' } });

    const documents = screen.getAllByTestId('document-item');
    expect(documents[0]).toHaveTextContent('Document 2');
    expect(documents[1]).toHaveTextContent('Document 1');
  });

  it('handles upload errors', async () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    documentService.uploadDocument.mockRejectedValueOnce(new Error('Upload failed'));

    render(<Documents />);

    const fileInput = screen.getByTestId('file-upload');
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  it('validates file type on upload', async () => {
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    render(<Documents />);

    const fileInput = screen.getByTestId('file-upload');
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(screen.getByText(/only pdf files are allowed/i)).toBeInTheDocument();
    expect(documentService.uploadDocument).not.toHaveBeenCalled();
  });

  it('handles search functionality', async () => {
    documentService.getDocuments.mockImplementation((params) => {
      if (params?.search === 'Document 1') {
        return [mockDocuments[0]];
      }
      return mockDocuments;
    });

    render(<Documents />);

    const searchInput = screen.getByPlaceholderText(/search documents/i);
    fireEvent.change(searchInput, { target: { value: 'Document 1' } });

    await waitFor(() => {
      expect(screen.getByText('Document 1')).toBeInTheDocument();
      expect(screen.queryByText('Document 2')).not.toBeInTheDocument();
    });
  });

  it('displays empty state when no documents', async () => {
    documentService.getDocuments.mockResolvedValueOnce([]);

    render(<Documents />);

    await waitFor(() => {
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    const manyDocs = Array.from({ length: 15 }, (_, i) => ({
      _id: `${i + 1}`,
      title: `Document ${i + 1}`,
      uploadedBy: 'user1',
      createdAt: `2023-01-${i + 1}`,
    }));

    documentService.getDocuments.mockResolvedValueOnce({
      documents: manyDocs.slice(0, 10),
      total: 15,
      page: 1,
      totalPages: 2,
    });

    render(<Documents />);

    await waitFor(() => {
      expect(screen.getByText('Document 1')).toBeInTheDocument();
    });

    const nextPageButton = screen.getByLabelText(/next page/i);
    fireEvent.click(nextPageButton);

    expect(documentService.getDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 })
    );
  });
});
