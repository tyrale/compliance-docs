const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../models/userModel');
const {
  createTestUser,
  generateToken,
  mockRequest,
  mockResponse,
} = require('../utils/testHelpers');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require('../../controllers/userController');

describe('User Controller', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('registerUser', () => {
    it('should create a new user successfully', async () => {
      const req = mockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        },
      });
      const res = mockResponse();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.any(mongoose.Types.ObjectId),
          name: 'Test User',
          email: 'test@example.com',
          token: expect.any(String),
        })
      );
    });

    it('should return error if email already exists', async () => {
      await createTestUser({ email: 'test@example.com' });

      const req = mockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        },
      });
      const res = mockResponse();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User already exists',
      });
    });

    it('should return error if required fields are missing', async () => {
      const req = mockRequest({
        body: {
          name: 'Test User',
          // Missing email and password
        },
      });
      const res = mockResponse();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('loginUser', () => {
    it('should login user successfully with correct credentials', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createTestUser({ password: hashedPassword });

      const req = mockRequest({
        body: {
          email: user.email,
          password: password,
        },
      });
      const res = mockResponse();

      await loginUser(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.any(mongoose.Types.ObjectId),
          email: user.email,
          token: expect.any(String),
        })
      );
    });

    it('should return error with incorrect password', async () => {
      const user = await createTestUser();

      const req = mockRequest({
        body: {
          email: user.email,
          password: 'wrongpassword',
        },
      });
      const res = mockResponse();

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid email or password',
      });
    });

    it('should return error if user does not exist', async () => {
      const req = mockRequest({
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });
      const res = mockResponse();

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile for authenticated user', async () => {
      const user = await createTestUser();
      const token = generateToken(user);

      const req = mockRequest({
        user: { _id: user._id },
      });
      const res = mockResponse();

      await getUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.any(mongoose.Types.ObjectId),
          name: user.name,
          email: user.email,
        })
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const user = await createTestUser();
      const updatedName = 'Updated Name';

      const req = mockRequest({
        user: { _id: user._id },
        body: {
          name: updatedName,
        },
      });
      const res = mockResponse();

      await updateUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: updatedName,
        })
      );

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.name).toBe(updatedName);
    });

    it('should update password if provided', async () => {
      const user = await createTestUser();
      const newPassword = 'newpassword123';

      const req = mockRequest({
        user: { _id: user._id },
        body: {
          password: newPassword,
        },
      });
      const res = mockResponse();

      await updateUserProfile(req, res);

      const updatedUser = await User.findById(user._id);
      const passwordMatch = await bcrypt.compare(newPassword, updatedUser.password);
      expect(passwordMatch).toBe(true);
    });

    it('should not allow email update to existing email', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      const req = mockRequest({
        user: { _id: user1._id },
        body: {
          email: user2.email,
        },
      });
      const res = mockResponse();

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
