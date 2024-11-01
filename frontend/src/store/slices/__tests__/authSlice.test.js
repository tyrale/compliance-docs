import authReducer, {
  login,
  logout,
  register,
  updateProfile,
  resetAuthError,
} from '../authSlice';
import * as authService from '../../../services/authService';

// Mock auth service
jest.mock('../../../services/authService');

describe('Auth Slice', () => {
  const initialState = {
    user: null,
    token: null,
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reducer', () => {
    it('should handle initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle logout', () => {
      const state = {
        user: { id: '1', name: 'Test User' },
        token: 'test-token',
        loading: false,
        error: null,
      };

      expect(authReducer(state, logout())).toEqual(initialState);
    });

    it('should handle resetAuthError', () => {
      const state = {
        ...initialState,
        error: 'Test error',
      };

      expect(authReducer(state, resetAuthError())).toEqual({
        ...state,
        error: null,
      });
    });
  });

  describe('async thunks', () => {
    describe('login', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      it('should handle successful login', async () => {
        const mockUser = { id: '1', name: 'Test User' };
        const mockToken = 'test-token';
        authService.login.mockResolvedValueOnce({ user: mockUser, token: mockToken });

        const dispatch = jest.fn();
        const thunk = login(credentials);
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(login.pending.type);
        expect(calls[1][0].type).toBe(login.fulfilled.type);
        expect(calls[1][0].payload).toEqual({ user: mockUser, token: mockToken });
      });

      it('should handle login failure', async () => {
        const errorMessage = 'Invalid credentials';
        authService.login.mockRejectedValueOnce(new Error(errorMessage));

        const dispatch = jest.fn();
        const thunk = login(credentials);
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(login.pending.type);
        expect(calls[1][0].type).toBe(login.rejected.type);
        expect(calls[1][0].error.message).toBe(errorMessage);
      });

      it('should set loading state correctly', () => {
        const state = authReducer(initialState, login.pending());
        expect(state.loading).toBe(true);
        expect(state.error).toBe(null);
      });
    });

    describe('register', () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      it('should handle successful registration', async () => {
        const mockUser = { id: '1', ...userData };
        const mockToken = 'test-token';
        authService.register.mockResolvedValueOnce({ user: mockUser, token: mockToken });

        const dispatch = jest.fn();
        const thunk = register(userData);
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(register.pending.type);
        expect(calls[1][0].type).toBe(register.fulfilled.type);
        expect(calls[1][0].payload).toEqual({ user: mockUser, token: mockToken });
      });

      it('should handle registration failure', async () => {
        const errorMessage = 'Email already exists';
        authService.register.mockRejectedValueOnce(new Error(errorMessage));

        const dispatch = jest.fn();
        const thunk = register(userData);
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(register.pending.type);
        expect(calls[1][0].type).toBe(register.rejected.type);
        expect(calls[1][0].error.message).toBe(errorMessage);
      });
    });

    describe('updateProfile', () => {
      const profileData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      it('should handle successful profile update', async () => {
        const mockUpdatedUser = { id: '1', ...profileData };
        authService.updateProfile.mockResolvedValueOnce(mockUpdatedUser);

        const dispatch = jest.fn();
        const thunk = updateProfile(profileData);
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(updateProfile.pending.type);
        expect(calls[1][0].type).toBe(updateProfile.fulfilled.type);
        expect(calls[1][0].payload).toEqual(mockUpdatedUser);
      });

      it('should handle profile update failure', async () => {
        const errorMessage = 'Update failed';
        authService.updateProfile.mockRejectedValueOnce(new Error(errorMessage));

        const dispatch = jest.fn();
        const thunk = updateProfile(profileData);
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(updateProfile.pending.type);
        expect(calls[1][0].type).toBe(updateProfile.rejected.type);
        expect(calls[1][0].error.message).toBe(errorMessage);
      });
    });
  });

  describe('state selectors', () => {
    it('should select user from state', () => {
      const mockUser = { id: '1', name: 'Test User' };
      const state = {
        auth: {
          user: mockUser,
          token: 'test-token',
          loading: false,
          error: null,
        },
      };

      expect(state.auth.user).toEqual(mockUser);
    });

    it('should select loading state', () => {
      const state = {
        auth: {
          ...initialState,
          loading: true,
        },
      };

      expect(state.auth.loading).toBe(true);
    });

    it('should select error state', () => {
      const errorMessage = 'Test error';
      const state = {
        auth: {
          ...initialState,
          error: errorMessage,
        },
      };

      expect(state.auth.error).toBe(errorMessage);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      authService.login.mockRejectedValueOnce(networkError);

      const dispatch = jest.fn();
      const thunk = login({ email: 'test@example.com', password: 'password' });
      await thunk(dispatch);

      const { calls } = dispatch.mock;
      expect(calls[1][0].type).toBe(login.rejected.type);
      expect(calls[1][0].error.message).toBe('Network error');
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid input');
      authService.register.mockRejectedValueOnce(validationError);

      const dispatch = jest.fn();
      const thunk = register({ name: '', email: '', password: '' });
      await thunk(dispatch);

      const { calls } = dispatch.mock;
      expect(calls[1][0].type).toBe(register.rejected.type);
      expect(calls[1][0].error.message).toBe('Invalid input');
    });
  });
});
