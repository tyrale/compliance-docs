const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/userModel');
const Document = require('../../models/documentModel');
const Section = require('../../models/sectionModel');

/**
 * Create a test user
 * @param {Object} overrides - Override default user properties
 * @returns {Promise<Object>} Created user object
 */
const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    role: 'user',
  };

  const user = await User.create({ ...defaultUser, ...overrides });
  return user;
};

/**
 * Generate a valid JWT token for a user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Create a test document
 * @param {Object} user - User who owns the document
 * @param {Object} overrides - Override default document properties
 * @returns {Promise<Object>} Created document object
 */
const createTestDocument = async (user, overrides = {}) => {
  const defaultDocument = {
    title: 'Test Document',
    fileName: 'test.pdf',
    fileType: 'pdf',
    fileSize: 1024,
    uploadedBy: user._id,
    metadata: {
      author: user.name,
      createdDate: new Date(),
      lastModified: new Date(),
      keywords: ['test'],
      category: 'test',
    },
    permissions: {
      readAccess: [],
      writeAccess: [],
    },
  };

  const document = await Document.create({ ...defaultDocument, ...overrides });
  return document;
};

/**
 * Create a test section
 * @param {Object} document - Document the section belongs to
 * @param {Object} user - User who creates the section
 * @param {Object} overrides - Override default section properties
 * @returns {Promise<Object>} Created section object
 */
const createTestSection = async (document, user, overrides = {}) => {
  const defaultSection = {
    document: document._id,
    title: 'Test Section',
    content: 'This is a test section content.',
    startPage: 1,
    endPage: 2,
    createdBy: user._id,
  };

  const section = await Section.create({ ...defaultSection, ...overrides });
  return section;
};

/**
 * Create auth header with token
 * @param {String} token - JWT token
 * @returns {Object} Headers object with Authorization
 */
const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

/**
 * Clean up test data
 * @param {Array} ids - Array of MongoDB ObjectIds to delete
 * @param {String} model - Model name to clean up
 */
const cleanupTestData = async (ids, model) => {
  const Model = mongoose.model(model);
  await Model.deleteMany({ _id: { $in: ids } });
};

/**
 * Create a mock request object
 * @param {Object} overrides - Override default request properties
 * @returns {Object} Mock request object
 */
const mockRequest = (overrides = {}) => {
  const req = {
    body: {},
    query: {},
    params: {},
    headers: {},
    ...overrides,
  };
  return req;
};

/**
 * Create a mock response object
 * @returns {Object} Mock response object with jest functions
 */
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Create a mock file object
 * @param {Object} overrides - Override default file properties
 * @returns {Object} Mock file object
 */
const mockFile = (overrides = {}) => {
  const defaultFile = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    destination: './uploads/',
    filename: `test-${Date.now()}.pdf`,
    path: `./uploads/test-${Date.now()}.pdf`,
    size: 1024,
  };

  return { ...defaultFile, ...overrides };
};

module.exports = {
  createTestUser,
  generateToken,
  createTestDocument,
  createTestSection,
  authHeader,
  cleanupTestData,
  mockRequest,
  mockResponse,
  mockFile,
};
