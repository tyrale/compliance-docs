import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test/utils/test-utils';
import { useNavigate } from 'react-router-dom';
import Search from '../Search';
import * as searchService from '../../services/searchService';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

// Mock search service
jest.mock('../../services/searchService');

describe('Search', () => {
  const navigate = jest.fn();
  const mockSearchResults = {
    documents: [
      {
        _id: '1',
        title: 'Compliance Policy',
        content: 'Test content',
        highlights: {
          content: ['Test <em>content</em>'],
        },
        score: 0.8,
      },
      {
        _id: '2',
        title: 'Security Guidelines',
        content: 'Security content',
        highlights: {
          content: ['<em>Security</em> content'],
        },
        score: 0.6,
      },
    ],
    sections: [
      {
        _id: 's1',
        documentId: '1',
        title: 'Policy Section',
        content: 'Section content',
        highlights: {
          content: ['Section <em>content</em>'],
        },
      },
    ],
    total: 3,
    page: 1,
    totalPages: 1,
  };

  const mockSearchHistory = [
    {
      _id: 'h1',
      query: 'compliance',
      timestamp: '2023-01-01',
      filters: { category: 'policy' },
    },
    {
      _id: 'h2',
      query: 'security',
      timestamp: '2023-01-02',
      filters: { category: 'security' },
    },
  ];

  beforeEach(() => {
    useNavigate.mockReturnValue(navigate);
    searchService.search.mockResolvedValue(mockSearchResults);
    searchService.getSearchHistory.mockResolvedValue(mockSearchHistory);
    searchService.getSuggestions.mockResolvedValue(['compliance', 'security']);
    jest.clearAllMocks();
  });

  it('renders search interface', () => {
    render(<Search />);

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    expect(screen.getByText(/advanced search/i)).toBeInTheDocument();
    expect(screen.getByText(/filters/i)).toBeInTheDocument();
  });

  it('performs basic search', async () => {
    render(<Search />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'compliance' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });

    await waitFor(() => {
      expect(searchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'compliance',
        })
      );
      expect(screen.getByText('Compliance Policy')).toBeInTheDocument();
    });
  });

  it('displays search suggestions', async () => {
    render(<Search />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'comp' } });

    await waitFor(() => {
      expect(screen.getByText('compliance')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('compliance'));
    expect(searchInput.value).toBe('compliance');
  });

  it('handles advanced search operators', async () => {
    render(<Search />);

    // Open advanced search
    fireEvent.click(screen.getByText(/advanced search/i));

    // Add field-specific search
    fireEvent.click(screen.getByText(/add field/i));
    fireEvent.change(screen.getByLabelText(/field/i), {
      target: { value: 'title' },
    });
    fireEvent.change(screen.getByLabelText(/value/i), {
      target: { value: 'policy' },
    });

    fireEvent.click(screen.getByText(/search/i));

    await waitFor(() => {
      expect(searchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'title:policy',
        })
      );
    });
  });

  it('applies search filters', async () => {
    render(<Search />);

    fireEvent.click(screen.getByText(/filters/i));
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'policy' },
    });
    fireEvent.change(screen.getByLabelText(/date range/i), {
      target: { value: 'last-month' },
    });

    fireEvent.click(screen.getByText(/apply filters/i));

    await waitFor(() => {
      expect(searchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: {
            category: 'policy',
            dateRange: 'last-month',
          },
        })
      );
    });
  });

  it('displays search history', async () => {
    render(<Search />);

    await waitFor(() => {
      expect(screen.getByText('compliance')).toBeInTheDocument();
      expect(screen.getByText('security')).toBeInTheDocument();
    });

    // Click history item to repeat search
    fireEvent.click(screen.getByText('compliance'));

    expect(searchService.search).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'compliance',
        filters: { category: 'policy' },
      })
    );
  });

  it('handles section-based search', async () => {
    render(<Search />);

    fireEvent.click(screen.getByText(/search in sections/i));
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'content' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });

    await waitFor(() => {
      expect(searchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          searchType: 'sections',
        })
      );
      expect(screen.getByText('Policy Section')).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    const paginatedResults = {
      ...mockSearchResults,
      total: 20,
      page: 1,
      totalPages: 2,
    };
    searchService.search.mockResolvedValueOnce(paginatedResults);

    render(<Search />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/next page/i));

    expect(searchService.search).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
      })
    );
  });

  it('displays highlighted search results', async () => {
    render(<Search />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'content' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });

    await waitFor(() => {
      const highlight = screen.getByText((content, element) => {
        return element.innerHTML.includes('<em>content</em>');
      });
      expect(highlight).toBeInTheDocument();
    });
  });

  it('navigates to document on result click', async () => {
    render(<Search />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'compliance' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText('Compliance Policy')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Compliance Policy'));
    expect(navigate).toHaveBeenCalledWith('/documents/1');
  });

  it('handles search errors', async () => {
    searchService.search.mockRejectedValueOnce(new Error('Search failed'));

    render(<Search />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText(/search failed/i)).toBeInTheDocument();
    });
  });

  it('saves search to history', async () => {
    render(<Search />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'new search' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });

    await waitFor(() => {
      expect(searchService.saveSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'new search',
        })
      );
    });
  });
});
