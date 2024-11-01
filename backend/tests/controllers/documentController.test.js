const mongoose = require('mongoose');
const {
  createTestUser,
  createTestDocument,
  mockRequest,
  mockResponse,
  mockFile,
} = require('../utils/testHelpers');
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  createVersion,
  getVersions,
  shareDocument,
  batchUpdateDocuments,
  updateMetadata,
} = require('../../controllers/documentController');
const Document = require('../../models/documentModel');
const Version = require('../../models/versionModel');

describe('Document Controller', () => {
  let user;
  let adminUser;
  let collaborator;

  beforeEach(async () => {
    await Document.deleteMany({});
    await Version.deleteMany({});

    user = await createTestUser();
    adminUser = await createTestUser({
      email: 'admin@example.com',
      role: 'admin',
    });
    collaborator = await createTestUser({
      email: 'collaborator@example.com',
    });
  });

  describe('uploadDocument', () => {
    it('should upload a document successfully', async () => {
      const file = mockFile();
      const req = mockRequest({
        user: { _id: user._id },
        file,
        body: {
          title: 'Test Document',
          metadata: {
            category: 'policy',
            tags: ['compliance', 'test'],
          },
        },
      });
      const res = mockResponse();

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Document',
          uploadedBy: user._id,
          fileName: expect.any(String),
          metadata: expect.objectContaining({
            category: 'policy',
            tags: expect.arrayContaining(['compliance', 'test']),
          }),
        })
      );

      const document = await Document.findOne({ title: 'Test Document' });
      expect(document).toBeTruthy();
      expect(document.versions.length).toBe(1);
    });

    it('should validate file type and size', async () => {
      const invalidFile = mockFile({ 
        mimetype: 'image/jpeg',
        size: 1024 * 1024 * 50 // 50MB
      });
      const req = mockRequest({
        user: { _id: user._id },
        file: invalidFile,
        body: { title: 'Invalid Document' },
      });
      const res = mockResponse();

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/file type|file size/i),
        })
      );
    });

    it('should handle duplicate document titles for same user', async () => {
      await createTestDocument(user, { title: 'Duplicate Title' });
      
      const file = mockFile();
      const req = mockRequest({
        user: { _id: user._id },
        file,
        body: { title: 'Duplicate Title' },
      });
      const res = mockResponse();

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/already exists/i),
        })
      );
    });
  });

  describe('Version Control', () => {
    it('should create a new version of a document', async () => {
      const document = await createTestDocument(user);
      const file = mockFile();
      
      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
        file,
        body: { 
          changeDescription: 'Updated content for compliance',
        },
      });
      const res = mockResponse();

      await createVersion(req, res);

      const updatedDoc = await Document.findById(document._id).populate('versions');
      expect(updatedDoc.versions).toHaveLength(2);
      expect(updatedDoc.versions[1].changeDescription).toBe('Updated content for compliance');
    });

    it('should retrieve version history', async () => {
      const document = await createTestDocument(user);
      // Create additional versions
      await Version.create([
        {
          document: document._id,
          fileName: 'v2.pdf',
          changeDescription: 'Second version',
          createdBy: user._id,
        },
        {
          document: document._id,
          fileName: 'v3.pdf',
          changeDescription: 'Third version',
          createdBy: user._id,
        },
      ]);

      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
      });
      const res = mockResponse();

      await getVersions(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            changeDescription: 'Third version',
          }),
        ])
      );
      expect(res.json.mock.calls[0][0]).toHaveLength(3);
    });
  });

  describe('Document Sharing and Permissions', () => {
    it('should share document with another user', async () => {
      const document = await createTestDocument(user);
      
      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
        body: {
          userId: collaborator._id,
          permissions: ['read', 'comment'],
        },
      });
      const res = mockResponse();

      await shareDocument(req, res);

      const updatedDoc = await Document.findById(document._id);
      expect(updatedDoc.permissions.readAccess).toContainEqual(collaborator._id);
      expect(updatedDoc.permissions.commentAccess).toContainEqual(collaborator._id);
    });

    it('should handle invalid sharing permissions', async () => {
      const document = await createTestDocument(user);
      
      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
        body: {
          userId: collaborator._id,
          permissions: ['invalid'],
        },
      });
      const res = mockResponse();

      await shareDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Batch Operations', () => {
    it('should update multiple documents', async () => {
      const docs = await Promise.all([
        createTestDocument(user, { category: 'old' }),
        createTestDocument(user, { category: 'old' }),
      ]);

      const req = mockRequest({
        user: { _id: user._id },
        body: {
          documentIds: docs.map(d => d._id),
          updates: {
            metadata: { category: 'new' },
          },
        },
      });
      const res = mockResponse();

      await batchUpdateDocuments(req, res);

      const updatedDocs = await Document.find({
        _id: { $in: docs.map(d => d._id) },
      });
      expect(updatedDocs).toHaveLength(2);
      updatedDocs.forEach(doc => {
        expect(doc.metadata.category).toBe('new');
      });
    });
  });

  describe('Metadata Management', () => {
    it('should update document metadata', async () => {
      const document = await createTestDocument(user);
      
      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
        body: {
          metadata: {
            category: 'compliance',
            tags: ['updated', 'policy'],
            expiryDate: '2024-12-31',
          },
        },
      });
      const res = mockResponse();

      await updateMetadata(req, res);

      const updatedDoc = await Document.findById(document._id);
      expect(updatedDoc.metadata).toEqual(
        expect.objectContaining({
          category: 'compliance',
          tags: expect.arrayContaining(['updated', 'policy']),
          expiryDate: expect.any(Date),
        })
      );
    });

    it('should validate metadata fields', async () => {
      const document = await createTestDocument(user);
      
      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
        body: {
          metadata: {
            category: '', // Empty category
            tags: 'invalid', // Should be array
          },
        },
      });
      const res = mockResponse();

      await updateMetadata(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // Original test cases...
  describe('getDocuments', () => {
    it('should return user\'s documents', async () => {
      const doc1 = await createTestDocument(user);
      const doc2 = await createTestDocument(user);
      await createTestDocument(adminUser); // Another user's document

      const req = mockRequest({
        user: { _id: user._id },
      });
      const res = mockResponse();

      await getDocuments(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            _id: doc1._id,
          }),
          expect.objectContaining({
            _id: doc2._id,
          }),
        ])
      );
      expect(res.json.mock.calls[0][0]).toHaveLength(2);
    });

    it('should return documents with read access', async () => {
      const doc = await createTestDocument(adminUser, {
        permissions: {
          readAccess: [user._id],
        },
      });

      const req = mockRequest({
        user: { _id: user._id },
      });
      const res = mockResponse();

      await getDocuments(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            _id: doc._id,
          }),
        ])
      );
    });

    it('should support pagination and sorting', async () => {
      // Create 15 documents
      const docs = await Promise.all(
        Array(15).fill(null).map((_, i) => 
          createTestDocument(user, {
            title: `Document ${i}`,
            createdAt: new Date(2023, 0, i + 1),
          })
        )
      );

      const req = mockRequest({
        user: { _id: user._id },
        query: {
          page: 2,
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });
      const res = mockResponse();

      await getDocuments(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: expect.any(Array),
          page: 2,
          totalPages: 3,
          total: 15,
        })
      );
      expect(res.json.mock.calls[0][0].documents).toHaveLength(5);
    });
  });

  describe('getDocumentById', () => {
    it('should return document by ID for owner', async () => {
      const document = await createTestDocument(user);

      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
      });
      const res = mockResponse();

      await getDocumentById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: document._id,
          title: document.title,
        })
      );
    });

    it('should return document for user with read access', async () => {
      const document = await createTestDocument(adminUser, {
        permissions: {
          readAccess: [user._id],
        },
      });

      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
      });
      const res = mockResponse();

      await getDocumentById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: document._id,
        })
      );
    });

    it('should return 404 for non-existent document', async () => {
      const req = mockRequest({
        user: { _id: user._id },
        params: { id: new mongoose.Types.ObjectId() },
      });
      const res = mockResponse();

      await getDocumentById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should deny access to unauthorized user', async () => {
      const document = await createTestDocument(adminUser);

      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
      });
      const res = mockResponse();

      await getDocumentById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateDocument', () => {
    it('should update document successfully', async () => {
      const document = await createTestDocument(user);
      const updatedTitle = 'Updated Title';

      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
        body: {
          title: updatedTitle,
        },
      });
      const res = mockResponse();

      await updateDocument(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: updatedTitle,
        })
      );

      const updatedDoc = await Document.findById(document._id);
      expect(updatedDoc.title).toBe(updatedTitle);
    });

    it('should deny update to non-owner', async () => {
      const document = await createTestDocument(adminUser);

      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
        body: {
          title: 'Updated Title',
        },
      });
      const res = mockResponse();

      await updateDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document and associated data', async () => {
      const document = await createTestDocument(user);

      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
      });
      const res = mockResponse();

      await deleteDocument(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Document removed',
        })
      );

      const deletedDoc = await Document.findById(document._id);
      expect(deletedDoc).toBeNull();

      const versions = await Version.find({ document: document._id });
      expect(versions).toHaveLength(0);
    });

    it('should deny deletion to non-owner', async () => {
      const document = await createTestDocument(adminUser);

      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
      });
      const res = mockResponse();

      await deleteDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(403);

      const docStillExists = await Document.findById(document._id);
      expect(docStillExists).toBeTruthy();
    });

    it('should handle cascading deletes', async () => {
      const document = await createTestDocument(user);
      // Create related data
      await Version.create([
        {
          document: document._id,
          fileName: 'v2.pdf',
          changeDescription: 'Second version',
          createdBy: user._id,
        },
        {
          document: document._id,
          fileName: 'v3.pdf',
          changeDescription: 'Third version',
          createdBy: user._id,
        },
      ]);

      const req = mockRequest({
        user: { _id: user._id },
        params: { id: document._id },
      });
      const res = mockResponse();

      await deleteDocument(req, res);

      // Verify all related data is deleted
      const versions = await Version.find({ document: document._id });
      expect(versions).toHaveLength(0);
    });
  });
});
