import documentReducer, {
  fetchDocuments,
  fetchDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  createVersion,
  createSection,
  updateSection,
  deleteSection,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
  shareDocument,
  resetDocumentError,
  setFilter,
  setSortOrder,
} from '../documentSlice';
import * as documentService from '../../../services/documentService';

// Mock document service
jest.mock('../../../services/documentService');

describe('Document Slice', () => {
  const initialState = {
    documents: [],
    currentDocument: null,
    loading: false,
    error: null,
    filters: {},
    sortOrder: 'createdAt_desc',
    pagination: {
      page: 1,
      totalPages: 1,
      total: 0,
    },
  };

  const mockDocument = {
    _id: '1',
    title: 'Test Document',
    content: 'Test content',
    versions: [],
    sections: [],
    annotations: [],
    metadata: {
      category: 'test',
      tags: ['test'],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reducer', () => {
    it('should handle initial state', () => {
      expect(documentReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setFilter', () => {
      const filter = { category: 'test' };
      const state = documentReducer(initialState, setFilter(filter));
      expect(state.filters).toEqual(filter);
      expect(state.pagination.page).toBe(1);
    });

    it('should handle setSortOrder', () => {
      const sortOrder = 'title_asc';
      const state = documentReducer(initialState, setSortOrder(sortOrder));
      expect(state.sortOrder).toBe(sortOrder);
      expect(state.pagination.page).toBe(1);
    });

    it('should handle resetDocumentError', () => {
      const state = {
        ...initialState,
        error: 'Test error',
      };
      expect(documentReducer(state, resetDocumentError())).toEqual({
        ...state,
        error: null,
      });
    });
  });

  describe('async thunks', () => {
    describe('fetchDocuments', () => {
      it('should handle successful documents fetch', async () => {
        const mockDocuments = [mockDocument];
        documentService.getDocuments.mockResolvedValueOnce({
          documents: mockDocuments,
          total: 1,
          page: 1,
          totalPages: 1,
        });

        const dispatch = jest.fn();
        const thunk = fetchDocuments();
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(fetchDocuments.pending.type);
        expect(calls[1][0].type).toBe(fetchDocuments.fulfilled.type);
        expect(calls[1][0].payload.documents).toEqual(mockDocuments);
      });

      it('should handle fetch documents failure', async () => {
        const error = new Error('Failed to fetch documents');
        documentService.getDocuments.mockRejectedValueOnce(error);

        const dispatch = jest.fn();
        const thunk = fetchDocuments();
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(fetchDocuments.pending.type);
        expect(calls[1][0].type).toBe(fetchDocuments.rejected.type);
        expect(calls[1][0].error.message).toBe('Failed to fetch documents');
      });
    });

    describe('fetchDocumentById', () => {
      it('should handle successful document fetch', async () => {
        documentService.getDocumentById.mockResolvedValueOnce(mockDocument);

        const dispatch = jest.fn();
        const thunk = fetchDocumentById('1');
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(fetchDocumentById.pending.type);
        expect(calls[1][0].type).toBe(fetchDocumentById.fulfilled.type);
        expect(calls[1][0].payload).toEqual(mockDocument);
      });
    });

    describe('createDocument', () => {
      it('should handle successful document creation', async () => {
        const formData = new FormData();
        documentService.uploadDocument.mockResolvedValueOnce(mockDocument);

        const dispatch = jest.fn();
        const thunk = createDocument(formData);
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(createDocument.pending.type);
        expect(calls[1][0].type).toBe(createDocument.fulfilled.type);
        expect(calls[1][0].payload).toEqual(mockDocument);
      });
    });

    describe('updateDocument', () => {
      it('should handle successful document update', async () => {
        const updates = { title: 'Updated Title' };
        const updatedDocument = { ...mockDocument, ...updates };
        documentService.updateDocument.mockResolvedValueOnce(updatedDocument);

        const dispatch = jest.fn();
        const thunk = updateDocument({ id: '1', updates });
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(updateDocument.pending.type);
        expect(calls[1][0].type).toBe(updateDocument.fulfilled.type);
        expect(calls[1][0].payload).toEqual(updatedDocument);
      });
    });

    describe('deleteDocument', () => {
      it('should handle successful document deletion', async () => {
        documentService.deleteDocument.mockResolvedValueOnce({ message: 'Deleted' });

        const dispatch = jest.fn();
        const thunk = deleteDocument('1');
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(deleteDocument.pending.type);
        expect(calls[1][0].type).toBe(deleteDocument.fulfilled.type);
        expect(calls[1][0].payload).toBe('1');
      });
    });

    describe('version management', () => {
      it('should handle creating new version', async () => {
        const newVersion = { _id: 'v1', fileName: 'v1.pdf' };
        documentService.createVersion.mockResolvedValueOnce(newVersion);

        const dispatch = jest.fn();
        const thunk = createVersion({ documentId: '1', formData: new FormData() });
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(createVersion.pending.type);
        expect(calls[1][0].type).toBe(createVersion.fulfilled.type);
        expect(calls[1][0].payload).toEqual(newVersion);
      });
    });

    describe('section management', () => {
      const mockSection = {
        _id: 's1',
        title: 'Test Section',
        content: 'Section content',
      };

      it('should handle creating new section', async () => {
        documentService.createSection.mockResolvedValueOnce(mockSection);

        const dispatch = jest.fn();
        const thunk = createSection({ documentId: '1', sectionData: mockSection });
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(createSection.pending.type);
        expect(calls[1][0].type).toBe(createSection.fulfilled.type);
        expect(calls[1][0].payload).toEqual(mockSection);
      });
    });

    describe('annotation management', () => {
      const mockAnnotation = {
        _id: 'a1',
        text: 'Test annotation',
        page: 1,
      };

      it('should handle creating new annotation', async () => {
        documentService.createAnnotation.mockResolvedValueOnce(mockAnnotation);

        const dispatch = jest.fn();
        const thunk = createAnnotation({ documentId: '1', annotationData: mockAnnotation });
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(createAnnotation.pending.type);
        expect(calls[1][0].type).toBe(createAnnotation.fulfilled.type);
        expect(calls[1][0].payload).toEqual(mockAnnotation);
      });
    });

    describe('document sharing', () => {
      it('should handle sharing document', async () => {
        const shareData = { email: 'test@example.com', permissions: ['read'] };
        documentService.shareDocument.mockResolvedValueOnce({ message: 'Shared successfully' });

        const dispatch = jest.fn();
        const thunk = shareDocument({ documentId: '1', shareData });
        await thunk(dispatch);

        const { calls } = dispatch.mock;
        expect(calls[0][0].type).toBe(shareDocument.pending.type);
        expect(calls[1][0].type).toBe(shareDocument.fulfilled.type);
      });
    });
  });

  describe('selectors', () => {
    it('should select documents with filters applied', () => {
      const state = {
        documents: {
          ...initialState,
          documents: [mockDocument],
          filters: { category: 'test' },
        },
      };

      expect(state.documents.documents).toEqual([mockDocument]);
      expect(state.documents.filters).toEqual({ category: 'test' });
    });

    it('should select current document', () => {
      const state = {
        documents: {
          ...initialState,
          currentDocument: mockDocument,
        },
      };

      expect(state.documents.currentDocument).toEqual(mockDocument);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const error = new Error('Network error');
      documentService.getDocuments.mockRejectedValueOnce(error);

      const dispatch = jest.fn();
      const thunk = fetchDocuments();
      await thunk(dispatch);

      const { calls } = dispatch.mock;
      expect(calls[1][0].type).toBe(fetchDocuments.rejected.type);
      expect(calls[1][0].error.message).toBe('Network error');
    });

    it('should handle validation errors', async () => {
      const error = new Error('Invalid document data');
      documentService.createDocument.mockRejectedValueOnce(error);

      const dispatch = jest.fn();
      const thunk = createDocument(new FormData());
      await thunk(dispatch);

      const { calls } = dispatch.mock;
      expect(calls[1][0].type).toBe(createDocument.rejected.type);
      expect(calls[1][0].error.message).toBe('Invalid document data');
    });
  });
});
