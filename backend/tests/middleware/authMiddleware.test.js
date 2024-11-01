const jwt = require('jsonwebtoken');
const {
  createTestUser,
  generateToken,
  mockRequest,
  mockResponse,
} = require('../utils/testHelpers');
const { protect, admin } = require('../../middleware/authMiddleware');
const User = require('../../models/userModel');

describe('Auth Middleware', () => {
  let user;
  let token;
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    await User.deleteMany({});
    
    // Create regular user
    user = await createTestUser();
    token = generateToken(user);

    // Create admin user
    adminUser = await createTestUser({
      email: 'admin@example.com',
      role: 'admin',
    });
    adminToken = generateToken(adminUser);
  });

  describe('protect middleware', () => {
    it('should allow access with valid token', async () => {
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
    });

    it('should deny access with no token', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not authorized, no token',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access with invalid token', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not authorized, token failed',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access with expired token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not authorized, token failed',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle malformed token header', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Invalid-Format-Token',
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('admin middleware', () => {
    it('should allow access for admin users', async () => {
      const req = mockRequest({
        user: adminUser,
      });
      const res = mockResponse();
      const next = jest.fn();

      await admin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for non-admin users', async () => {
      const req = mockRequest({
        user: user, // Regular user
      });
      const res = mockResponse();
      const next = jest.fn();

      await admin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not authorized as an admin',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle missing user object', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      await admin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not authorized, no token',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('integration of protect and admin middleware', () => {
    it('should work together for admin routes', async () => {
      // First apply protect middleware
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protect(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();

      // Then apply admin middleware
      await admin(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);
    });

    it('should deny access for non-admin user on admin routes', async () => {
      // First apply protect middleware with regular user token
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protect(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();

      // Then apply admin middleware
      await admin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
