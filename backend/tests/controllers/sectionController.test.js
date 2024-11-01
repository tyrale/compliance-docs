const mongoose = require('mongoose');
const {
  createTestUser,
  createTestDocument,
  mockRequest,
  mockResponse,
  mockFile,
} = require('../utils/testHelpers');
const {
  createSection,
  getSections,
  getSectionById,
  updateSection,
  deleteSection,
  generateSectionSummary,
  getSectionAnalysis,
  batchAnalyzeSections,
} = require('../../controllers/sectionController');
const Section = require('../../models/sectionModel');
const Document = require('../../models/documentModel');
const { extractTextFromPDF } = require('../../utils/pdfUtils');
const {
  generateSummary,
  analyzeSentiment,
  extractKeyPhrases,
  classifyContent,
} = require('../../utils/nlpUtils');

// Mock the NLP and PDF utilities
jest.mock('../../utils/pdfUtils');
jest.mock('../../utils/nlpUtils');

describe('Section Controller', () => {
  let user;
  let adminUser;
  let document1;

  beforeEach(async () => {
    await Section.deleteMany({});
    await Document.deleteMany({});

    // Reset all mocks
    jest.clearAllMocks();

    user = await createTestUser();
    adminUser = await createTestUser({
      email: 'admin@example.com',
      role: 'admin',
    });
    document1 = await createTestDocument(user);

    // Mock NLP utility functions
    generateSummary.mockResolvedValue({
      summary: 'Test summary',
      confidence: 0.85,
    });
    analyzeSentiment.mockResolvedValue({
      sentiment: 'positive',
      confidence: 0.75,
    });
    extractKeyPhrases.mockResolvedValue(['key', 'phrase']);
    classifyContent.mockResolvedValue({
      categories: ['compliance'],
      confidence: 0.9,
    });
    extractTextFromPDF.mockResolvedValue('Extracted PDF content');
  });

  describe('createSection', () => {
    it('should create a section successfully', async () => {
      const req = mockRequest({
        user: { _id: user._id },
        params: { documentId: document1._id },
        body: {
          title: 'Test Section',
          content: 'Test content',
          startPage: 1,
          endPage: 2,
        },
      });
      const res = mockResponse();

      await createSection(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Section',
          content: 'Test content',
          document: document1._id,
          createdBy: user._id,
        })
      );

      // Verify document was updated with section reference
      const updatedDoc = await Document.findById(document1._id);
      expect(updatedDoc.sections).toHaveLength(1);
    });

    it('should extract content from PDF if not provided', async () => {
      const req = mockRequest({
        user: { _id: user._id },
        params: { documentId: document1._id },
        body: {
          title: 'PDF Section',
          startPage: 1,
          endPage: 2,
        },
      });
      const res = mockResponse();

      await createSection(req, res);

      expect(extractTextFromPDF).toHaveBeenCalledWith(
        expect.any(String),
        1,
        2
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Extracted PDF content',
        })
      );
    });

    it('should validate required fields', async () => {
      const req = mockRequest({
        user: { _id: user._id },
        params: { documentId: document1._id },
        body: {
          title: 'Test Section',
          // Missing startPage and endPage
        },
      });
      const res = mockResponse();

      await createSection(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getSections', () => {
    it('should return all sections for a document', async () => {
      const sections = await Section.create([
        {
          document: document1._id,
          title: 'Section 1',
          content: 'Content 1',
          startPage: 1,
          endPage: 2,
          createdBy: user._id,
        },
        {
          document: document1._id,
          title: 'Section 2',
          content: 'Content 2',
          startPage: 3,
          endPage: 4,
          createdBy: user._id,
        },
      ]);

      const req = mockRequest({
        user: { _id: user._id },
        params: { documentId: document1._id },
      });
      const res = mockResponse();

      await getSections(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Section 1' }),
          expect.objectContaining({ title: 'Section 2' }),
        ])
      );
    });
  });

  describe('getSectionById', () => {
    it('should return section by ID', async () => {
      const section = await Section.create({
        document: document1._id,
        title: 'Test Section',
        content: 'Test content',
        startPage: 1,
        endPage: 2,
        createdBy: user._id,
      });

      const req = mockRequest({
        user: { _id: user._id },
        params: {
          documentId: document1._id,
          id: section._id,
        },
      });
      const res = mockResponse();

      await getSectionById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Section',
          content: 'Test content',
        })
      );
    });
  });

  describe('updateSection', () => {
    it('should update section successfully', async () => {
      const section = await Section.create({
        document: document1._id,
        title: 'Original Title',
        content: 'Original content',
        startPage: 1,
        endPage: 2,
        createdBy: user._id,
      });

      const req = mockRequest({
        user: { _id: user._id },
        params: {
          documentId: document1._id,
          id: section._id,
        },
        body: {
          title: 'Updated Title',
          content: 'Updated content',
        },
      });
      const res = mockResponse();

      await updateSection(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          content: 'Updated content',
        })
      );
    });
  });

  describe('deleteSection', () => {
    it('should delete section and update document', async () => {
      const section = await Section.create({
        document: document1._id,
        title: 'Test Section',
        content: 'Test content',
        startPage: 1,
        endPage: 2,
        createdBy: user._id,
      });

      document1.sections.push(section._id);
      await document1.save();

      const req = mockRequest({
        user: { _id: user._id },
        params: {
          documentId: document1._id,
          id: section._id,
        },
      });
      const res = mockResponse();

      await deleteSection(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Section removed',
        })
      );

      const deletedSection = await Section.findById(section._id);
      expect(deletedSection).toBeNull();
    });
  });

  describe('NLP Features', () => {
    let section;

    beforeEach(async () => {
      section = await Section.create({
        document: document1._id,
        title: 'Test Section',
        content: 'Test content for NLP analysis',
        startPage: 1,
        endPage: 2,
        createdBy: user._id,
      });
    });

    it('should generate section summary', async () => {
      const req = mockRequest({
        user: { _id: user._id },
        params: {
          documentId: document1._id,
          id: section._id,
        },
        query: { maxLength: 100 },
      });
      const res = mockResponse();

      await generateSectionSummary(req, res);

      expect(generateSummary).toHaveBeenCalledWith(
        'Test content for NLP analysis',
        100
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Test summary',
          metadata: expect.objectContaining({
            summaryConfidence: 0.85,
          }),
        })
      );
    });

    it('should get section analysis', async () => {
      const req = mockRequest({
        user: { _id: user._id },
        params: {
          documentId: document1._id,
          id: section._id,
        },
      });
      const res = mockResponse();

      await getSectionAnalysis(req, res);

      expect(analyzeSentiment).toHaveBeenCalled();
      expect(extractKeyPhrases).toHaveBeenCalled();
      expect(classifyContent).toHaveBeenCalled();
    });
  });

  describe('Batch Operations', () => {
    it('should analyze multiple sections', async () => {
      const sections = await Section.create([
        {
          document: document1._id,
          title: 'Section 1',
          content: 'Content 1',
          startPage: 1,
          endPage: 2,
          createdBy: user._id,
        },
        {
          document: document1._id,
          title: 'Section 2',
          content: 'Content 2',
          startPage: 3,
          endPage: 4,
          createdBy: user._id,
        },
      ]);

      const req = mockRequest({
        user: { _id: user._id },
        params: { documentId: document1._id },
        body: {
          sectionIds: sections.map(s => s._id),
        },
      });
      const res = mockResponse();

      await batchAnalyzeSections(req, res);

      expect(res.json.mock.calls[0][0]).toHaveLength(2);
      expect(generateSummary).toHaveBeenCalledTimes(2);
      expect(analyzeSentiment).toHaveBeenCalledTimes(2);
    });
  });
});
