import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test/utils/test-utils';
import { useNavigate, useLocation } from 'react-router-dom';
import Login from '../Login';
import { login } from '../../store/slices/authSlice';
import * as authService from '../../services/authService';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

// Mock auth service
jest.mock('../../services/authService');

describe('Login', () => {
  const navigate = jest.fn();
  const mockLocation = {
    state: { from: '/documents' },
  };

  beforeEach(() => {
    useNavigate.mockReturnValue(navigate);
    useLocation.mockReturnValue(mockLocation);
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    render(<Login />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
  });

  it('handles form submission with valid credentials', async () => {
    const mockUser = {
      _id: '123',
      name: 'Test User',
      email: 'test@example.com',
    };
    const mockToken = 'test-token';

    authService.login.mockResolvedValueOnce({
      user: mockUser,
      token: mockToken,
    });

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(navigate).toHaveBeenCalledWith('/documents');
    });
  });

  it('displays validation errors for empty fields', async () => {
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('displays error message on failed login', async () => {
    authService.login.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('navigates to register page when clicking signup link', () => {
    render(<Login />);

    fireEvent.click(screen.getByText(/sign up/i));

    expect(navigate).toHaveBeenCalledWith('/register');
  });

  it('shows loading state during form submission', async () => {
    authService.login.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('validates email format', async () => {
    render(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('redirects to dashboard if already logged in', () => {
    const initialState = {
      auth: {
        user: { _id: '123', name: 'Test User' },
        token: 'test-token',
      },
    };

    render(<Login />, { preloadedState: initialState });

    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('preserves return URL from location state', async () => {
    const mockUser = {
      _id: '123',
      name: 'Test User',
      email: 'test@example.com',
    };
    const mockToken = 'test-token';

    authService.login.mockResolvedValueOnce({
      user: mockUser,
      token: mockToken,
    });

    useLocation.mockReturnValue({
      state: { from: '/documents/123' },
    });

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/documents/123');
    });
  });
});
