import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test/utils/test-utils';
import { useParams, useNavigate } from 'react-router-dom';
import DocumentView from '../DocumentView';
import * as documentService from '../../services/documentService';
import * as pdfjs from 'pdfjs-dist';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

// Mock document service
jest.mock('../../services/documentService');

// Mock PDF.js
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
}));

describe('DocumentView', () => {
  const mockDocument = {
    _id: '123',
    title: 'Test Document',
    fileName: 'test.pdf',
    uploadedBy: 'user1',
    createdAt: '2023-01-01',
    metadata: {
      category: 'policy',
      tags: ['compliance'],
    },
    versions: [
      {
        _id: 'v1',
        fileName: 'test_v1.pdf',
        createdAt: '2023-01-01',
      },
    ],
    sections: [
      {
        _id: 's1',
        title: 'Section 1',
        content: 'Test content',
        startPage: 1,
        endPage: 2,
      },
    ],
    annotations: [
      {
        _id: 'a1',
        text: 'Test annotation',
        page: 1,
        position: { x: 100, y: 100 },
        user: {
          _id: 'user1',
          name: 'Test User',
        },
      },
    ],
  };

  const mockPdfDocument = {
    numPages: 5,
    getPage: jest.fn().mockResolvedValue({
      getViewport: () => ({ width: 800, height: 1000 }),
      render: jest.fn(),
    }),
  };

  beforeEach(() => {
    useParams.mockReturnValue({ id: '123' });
    useNavigate.mockReturnValue(jest.fn());
    documentService.getDocumentById.mockResolvedValue(mockDocument);
    pdfjs.getDocument.mockResolvedValue(mockPdfDocument);
    jest.clearAllMocks();
  });

  it('renders document details', async () => {
    render(<DocumentView />);

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('policy')).toBeInTheDocument();
      expect(screen.getByText('compliance')).toBeInTheDocument();
    });
  });

  it('displays PDF viewer', async () => {
    render(<DocumentView />);

    await waitFor(() => {
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      expect(pdfjs.getDocument).toHaveBeenCalled();
    });
  });

  it('handles section navigation', async () => {
    render(<DocumentView />);

    await waitFor(() => {
      expect(screen.getByText('Section 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Section 1'));
    expect(screen.getByTestId('pdf-viewer')).toHaveAttribute('data-page', '1');
  });

  it('displays annotations', async () => {
    render(<DocumentView />);

    await waitFor(() => {
      expect(screen.getByText('Test annotation')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('handles new annotation creation', async () => {
    const newAnnotation = {
      _id: 'a2',
      text: 'New annotation',
      page: 1,
      position: { x: 200, y: 200 },
      user: {
        _id: 'user1',
        name: 'Test User',
      },
    };

    documentService.createAnnotation.mockResolvedValueOnce(newAnnotation);

    render(<DocumentView />);

    await waitFor(() => {
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });

    // Simulate PDF click
    fireEvent.click(screen.getByTestId('pdf-viewer'), {
      clientX: 200,
      clientY: 200,
    });

    // Fill annotation form
    fireEvent.change(screen.getByPlaceholderText(/add annotation/i), {
      target: { value: 'New annotation' },
    });
    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(screen.getByText('New annotation')).toBeInTheDocument();
    });
  });

  it('handles version switching', async () => {
    render(<DocumentView />);

    await waitFor(() => {
      expect(screen.getByText(/version 1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/version 1/i));
    expect(pdfjs.getDocument).toHaveBeenCalledWith(
      expect.stringContaining('test_v1.pdf')
    );
  });

  it('handles document sharing', async () => {
    documentService.shareDocument.mockResolvedValueOnce({ message: 'Shared successfully' });

    render(<DocumentView />);

    await waitFor(() => {
      expect(screen.getByText(/share/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/share/i));
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByText(/send invitation/i));

    await waitFor(() => {
      expect(documentService.shareDocument).toHaveBeenCalledWith(
        '123',
        'test@example.com',
        expect.any(Array)
      );
    });
  });

  it('handles section creation', async () => {
    const newSection = {
      _id: 's2',
      title: 'New Section',
      content: 'New content',
      startPage: 3,
      endPage: 4,
    };

    documentService.createSection.mockResolvedValueOnce(newSection);

    render(<DocumentView />);

    await waitFor(() => {
      expect(screen.getByText(/add section/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/add section/i));
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'New Section' },
    });
    fireEvent.change(screen.getByLabelText(/start page/i), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByLabelText(/end page/i), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByText(/save section/i));

    await waitFor(() => {
      expect(screen.getByText('New Section')).toBeInTheDocument();
    });
  });

  it('handles error states', async () => {
    documentService.getDocumentById.mockRejectedValueOnce(new Error('Failed to load document'));

    render(<DocumentView />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load document/i)).toBeInTheDocument();
    });
  });

  it('handles document metadata updates', async () => {
    const updatedMetadata = {
      ...mockDocument.metadata,
      category: 'updated-policy',
      tags: ['compliance', 'new-tag'],
    };

    documentService.updateDocument.mockResolvedValueOnce({
      ...mockDocument,
      metadata: updatedMetadata,
    });

    render(<DocumentView />);

    await waitFor(() => {
      expect(screen.getByText(/edit/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/edit/i));
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'updated-policy' },
    });
    fireEvent.click(screen.getByText(/add tag/i));
    fireEvent.change(screen.getByPlaceholderText(/new tag/i), {
      target: { value: 'new-tag' },
    });
    fireEvent.click(screen.getByText(/save changes/i));

    await waitFor(() => {
      expect(screen.getByText('updated-policy')).toBeInTheDocument();
      expect(screen.getByText('new-tag')).toBeInTheDocument();
    });
  });

  it('handles PDF navigation controls', async () => {
    render(<DocumentView />);

    await waitFor(() => {
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });

    const nextButton = screen.getByLabelText(/next page/i);
    const prevButton = screen.getByLabelText(/previous page/i);
    const pageInput = screen.getByLabelText(/page number/i);

    fireEvent.click(nextButton);
    expect(screen.getByTestId('pdf-viewer')).toHaveAttribute('data-page', '2');

    fireEvent.click(prevButton);
    expect(screen.getByTestId('pdf-viewer')).toHaveAttribute('data-page', '1');

    fireEvent.change(pageInput, { target: { value: '3' } });
    fireEvent.blur(pageInput);
    expect(screen.getByTestId('pdf-viewer')).toHaveAttribute('data-page', '3');
  });
});
