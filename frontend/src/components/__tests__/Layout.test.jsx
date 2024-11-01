import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test/utils/test-utils';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import { logout } from '../../store/slices/authSlice';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

// Mock redux dispatch
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

describe('Layout', () => {
  const navigate = jest.fn();
  const mockChildren = <div>Test Content</div>;

  beforeEach(() => {
    useNavigate.mockReturnValue(navigate);
  });

  it('renders the layout with navigation and content', () => {
    const initialState = {
      auth: {
        user: { _id: '123', name: 'Test User' },
        token: 'test-token',
      },
    };

    render(
      <Layout>{mockChildren}</Layout>,
      { preloadedState: initialState }
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('handles navigation menu clicks', async () => {
    const initialState = {
      auth: {
        user: { _id: '123', name: 'Test User' },
        token: 'test-token',
      },
    };

    render(
      <Layout>{mockChildren}</Layout>,
      { preloadedState: initialState }
    );

    fireEvent.click(screen.getByText('Documents'));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/documents');
    });
  });

  it('handles user menu interactions', () => {
    const initialState = {
      auth: {
        user: { _id: '123', name: 'Test User' },
        token: 'test-token',
      },
    };

    render(
      <Layout>{mockChildren}</Layout>,
      { preloadedState: initialState }
    );

    // Open user menu
    fireEvent.click(screen.getByTestId('user-menu-button'));
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('handles logout', async () => {
    const initialState = {
      auth: {
        user: { _id: '123', name: 'Test User' },
        token: 'test-token',
      },
    };

    const { store } = render(
      <Layout>{mockChildren}</Layout>,
      { preloadedState: initialState }
    );

    // Open user menu and click logout
    fireEvent.click(screen.getByTestId('user-menu-button'));
    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(store.getState().auth.user).toBeNull();
      expect(store.getState().auth.token).toBeNull();
      expect(navigate).toHaveBeenCalledWith('/login');
    });
  });

  it('displays appropriate navigation based on user role', () => {
    const initialState = {
      auth: {
        user: { _id: '123', name: 'Admin User', role: 'admin' },
        token: 'test-token',
      },
    };

    render(
      <Layout>{mockChildren}</Layout>,
      { preloadedState: initialState }
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('handles responsive design', () => {
    const initialState = {
      auth: {
        user: { _id: '123', name: 'Test User' },
        token: 'test-token',
      },
    };

    render(
      <Layout>{mockChildren}</Layout>,
      { preloadedState: initialState }
    );

    // Test mobile menu button visibility
    const menuButton = screen.getByLabelText('menu');
    expect(menuButton).toBeInTheDocument();

    // Test mobile menu interaction
    fireEvent.click(menuButton);
    expect(screen.getByText('Documents')).toBeVisible();
  });

  it('displays loading state when appropriate', () => {
    const initialState = {
      auth: {
        user: { _id: '123', name: 'Test User' },
        token: 'test-token',
        loading: true,
      },
    };

    render(
      <Layout>{mockChildren}</Layout>,
      { preloadedState: initialState }
    );

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });
});
