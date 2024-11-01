import React from 'react';
import { render, screen } from '../../test/utils/test-utils';
import { Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(() => null),
  useLocation: jest.fn(),
}));

describe('ProtectedRoute', () => {
  const MockComponent = () => <div>Protected Content</div>;

  beforeEach(() => {
    Navigate.mockClear();
    useLocation.mockReturnValue({ pathname: '/protected' });
  });

  it('renders children when user is authenticated', () => {
    const initialState = {
      auth: {
        user: { _id: '123', name: 'Test User' },
        token: 'test-token',
      },
    };

    render(
      <ProtectedRoute>
        <MockComponent />
      </ProtectedRoute>,
      { preloadedState: initialState }
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(Navigate).not.toHaveBeenCalled();
  });

  it('redirects to login when user is not authenticated', () => {
    const initialState = {
      auth: {
        user: null,
        token: null,
      },
    };

    render(
      <ProtectedRoute>
        <MockComponent />
      </ProtectedRoute>,
      { preloadedState: initialState }
    );

    expect(Navigate).toHaveBeenCalledWith(
      {
        to: '/login',
        state: { from: '/protected' },
        replace: true,
      },
      {}
    );
  });

  it('redirects to login when token is expired', () => {
    const initialState = {
      auth: {
        user: { _id: '123', name: 'Test User' },
        token: 'expired-token',
        error: 'Token expired',
      },
    };

    render(
      <ProtectedRoute>
        <MockComponent />
      </ProtectedRoute>,
      { preloadedState: initialState }
    );

    expect(Navigate).toHaveBeenCalledWith(
      {
        to: '/login',
        state: { from: '/protected' },
        replace: true,
      },
      {}
    );
  });

  it('handles role-based access control', () => {
    const initialState = {
      auth: {
        user: { _id: '123', name: 'Test User', role: 'user' },
        token: 'test-token',
      },
    };

    render(
      <ProtectedRoute requiredRole="admin">
        <MockComponent />
      </ProtectedRoute>,
      { preloadedState: initialState }
    );

    expect(Navigate).toHaveBeenCalledWith(
      {
        to: '/dashboard',
        replace: true,
      },
      {}
    );
  });

  it('allows access when user has required role', () => {
    const initialState = {
      auth: {
        user: { _id: '123', name: 'Test User', role: 'admin' },
        token: 'test-token',
      },
    };

    render(
      <ProtectedRoute requiredRole="admin">
        <MockComponent />
      </ProtectedRoute>,
      { preloadedState: initialState }
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(Navigate).not.toHaveBeenCalled();
  });
});
