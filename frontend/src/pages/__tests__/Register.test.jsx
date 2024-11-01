import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test/utils/test-utils';
import { useNavigate } from 'react-router-dom';
import Register from '../Register';
import * as authService from '../../services/authService';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

// Mock auth service
jest.mock('../../services/authService');

describe('Register', () => {
  const navigate = jest.fn();

  beforeEach(() => {
    useNavigate.mockReturnValue(navigate);
    jest.clearAllMocks();
  });

  it('renders registration form', () => {
    render(<Register />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
  });

  it('handles successful registration', async () => {
    const mockUser = {
      _id: '123',
      name: 'Test User',
      email: 'test@example.com',
    };
    const mockToken = 'test-token';

    authService.register.mockResolvedValueOnce({
      user: mockUser,
      token: mockToken,
    });

    render(<Register />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(navigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays validation errors for empty fields', async () => {
    render(<Register />);

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates password match', async () => {
    render(<Register />);

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password456' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('handles registration error', async () => {
    authService.register.mockRejectedValueOnce(new Error('Email already exists'));

    render(<Register />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('navigates to login page when clicking signin link', () => {
    render(<Register />);

    fireEvent.click(screen.getByText(/sign in/i));

    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('shows loading state during form submission', async () => {
    authService.register.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<Register />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();
  });

  it('validates password strength', async () => {
    render(<Register />);

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'weak' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'weak' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('redirects to dashboard if already logged in', () => {
    const initialState = {
      auth: {
        user: { _id: '123', name: 'Test User' },
        token: 'test-token',
      },
    };

    render(<Register />, { preloadedState: initialState });

    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });
});
