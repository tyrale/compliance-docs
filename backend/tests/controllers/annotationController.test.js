const mongoose = require('mongoose');
const {
  createTestUser,
  createTestDocument,
  mockRequest,
  mockResponse,
} = require('../utils/testHelpers');
const {
  createAnnotation,
  getAnnotations,
  getAnnotationById,
  updateAnnotation,
  deleteAnnotation,
} = require('../../controllers/annotationController');
const Annotation = require('../../models/annotationModel');
const Document = require('../../models/documentModel');

describe('Annotation Controller', () => {
  let user;
  let otherUser;
  let document1;

  beforeEach(async () => {
    await Annotation.deleteMany({});
    await Document.deleteMany({});

    user = await createTestUser();
    otherUser = await createTestUser({
      email: 'other@example.com',
    });
    document1 = await createTestDocument(user);
  });

  describe('createAnnotation', () => {
    it('should create an annotation successfully', async () => {
      const req = mockRequest({
        user: { _id: user._id },
        params: { documentId: document1._id },
        body: {
          text: 'Test annotation',
          page: 1,
          position: { x: 100, y: 100 },
        },
      });
      const res = mockResponse();

      await createAnnotation(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Test annotation',
          page: 1,
          position: expect.objectContaining({ x: 100, y: 100 }),
          user: expect.objectContaining({
            name: expect.any(String),
            email: expect.any(String),
          }),
        })
      );

      // Verify document was updated with annotation reference
      const updatedDoc = await Document.findById(document1._id);
      expect(updatedDoc.annotations).toHaveLength(1);
    });

    it('should validate required fields', async () => {
      const req = mockRequest({
        user: { _id: user._id },
        params: { documentId: document1._id },
        body: {
          text: 'Test annotation',
          // Missing page and position
        },
      });
      const res = mockResponse();

      await createAnnotation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should check document access permissions', async () => {
      const otherDoc = await createTestDocument(otherUser);
      const req = mockRequest({
        user: { _id: user._id },
        params: { documentId: otherDoc._id },
        body: {
          text: 'Test annotation',
          page: 1,
          position: { x: 100, y: 100 },
        },
      });
      const res = mockResponse();

      await createAnnotation(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getAnnotations', () => {
    it('should return all annotations for a document', async () => {
      // Create test annotations
      await Annotation.create([
        {
          document: document1._id,
          user: user._id,
          text: 'Annotation 1',
          page: 1,
          position: { x: 100, y: 100 },
        },
        {
          document: document1._id,
          user: user._id,
          text: 'Annotation 2',
          page: 2,
          position: { x: 200, y: 200 },
        },
      ]);

      const req = mockRequest({
        user: { _id: user._id },
        params: { documentId: document1._id },
      });
      const res = mockResponse();

      await getAnnotations(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            text: 'Annotation 1',
          }),
          expect.objectContaining({
            text: 'Annotation 2',
          }),
        ])
      );
    });

    it('should return annotations sorted by creation date', async () => {
      const annotations = await Annotation.create([
        {
          document: document1._id,
          user: user._id,
          text: 'Older annotation',
          page: 1,
          position: { x: 100, y: 100 },
          createdAt: new Date('2023-01-01'),
        },
        {
          document: document1._id,
          user: user._id,
          text: 'Newer annotation',
          page: 2,
          position: { x: 200, y: 200 },
          createdAt: new Date('2023-01-02'),
        },
      ]);

      const req = mockRequest({
        user: { _id: user._id },
        params: { documentId: document1._id },
      });
      const res = mockResponse();

      await getAnnotations(req, res);

      const responseAnnotations = res.json.mock.calls[0][0];
      expect(responseAnnotations[0].text).toBe('Newer annotation');
      expect(responseAnnotations[1].text).toBe('Older annotation');
    });
  });

  describe('getAnnotationById', () => {
    it('should return annotation by ID', async () => {
      const annotation = await Annotation.create({
        document: document1._id,
        user: user._id,
        text: 'Test annotation',
        page: 1,
        position: { x: 100, y: 100 },
      });

      const req = mockRequest({
        user: { _id: user._id },
        params: {
          documentId: document1._id,
          id: annotation._id,
        },
      });
      const res = mockResponse();

      await getAnnotationById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Test annotation',
          user: expect.objectContaining({
            name: expect.any(String),
            email: expect.any(String),
          }),
        })
      );
    });

    it('should handle non-existent annotation', async () => {
      const req = mockRequest({
        user: { _id: user._id },
        params: {
          documentId: document1._id,
          id: new mongoose.Types.ObjectId(),
        },
      });
      const res = mockResponse();

      await getAnnotationById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateAnnotation', () => {
    it('should update annotation successfully', async () => {
      const annotation = await Annotation.create({
        document: document1._id,
        user: user._id,
        text: 'Original text',
        page: 1,
        position: { x: 100, y: 100 },
      });

      const req = mockRequest({
        user: { _id: user._id },
        params: {
          documentId: document1._id,
          id: annotation._id,
        },
        body: {
          text: 'Updated text',
        },
      });
      const res = mockResponse();

      await updateAnnotation(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Updated text',
          lastModified: expect.any(Date),
        })
      );
    });

    it('should prevent updating by non-owner', async () => {
      const annotation = await Annotation.create({
        document: document1._id,
        user: otherUser._id,
        text: 'Original text',
        page: 1,
        position: { x: 100, y: 100 },
      });

      const req = mockRequest({
        user: { _id: user._id },
        params: {
          documentId: document1._id,
          id: annotation._id,
        },
        body: {
          text: 'Updated text',
        },
      });
      const res = mockResponse();

      await updateAnnotation(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteAnnotation', () => {
    it('should delete annotation and update document', async () => {
      const annotation = await Annotation.create({
        document: document1._id,
        user: user._id,
        text: 'Test annotation',
        page: 1,
        position: { x: 100, y: 100 },
      });

      // Add annotation to document
      document1.annotations.push(annotation._id);
      await document1.save();

      const req = mockRequest({
        user: { _id: user._id },
        params: {
          documentId: document1._id,
          id: annotation._id,
        },
      });
      const res = mockResponse();

      await deleteAnnotation(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Annotation removed',
        })
      );

      // Verify annotation was removed from document
      const updatedDoc = await Document.findById(document1._id);
      expect(updatedDoc.annotations).not.toContainEqual(annotation._id);

      // Verify annotation was deleted
      const deletedAnnotation = await Annotation.findById(annotation._id);
      expect(deletedAnnotation).toBeNull();
    });

    it('should prevent deletion by non-owner', async () => {
      const annotation = await Annotation.create({
        document: document1._id,
        user: otherUser._id,
        text: 'Test annotation',
        page: 1,
        position: { x: 100, y: 100 },
      });

      const req = mockRequest({
        user: { _id: user._id },
        params: {
          documentId: document1._id,
          id: annotation._id,
        },
      });
      const res = mockResponse();

      await deleteAnnotation(req, res);

      expect(res.status).toHaveBeenCalledWith(403);

      // Verify annotation still exists
      const existingAnnotation = await Annotation.findById(annotation._id);
      expect(existingAnnotation).toBeTruthy();
    });
  });
});
