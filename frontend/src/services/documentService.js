import api from './api';

const documentService = {
  // Document CRUD operations
  getAllDocuments: async () => {
    const response = await api.get('/documents');
    return response.data;
  },

  getDocument: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  uploadDocument: async (formData, onProgress) => {
    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minute timeout to match backend
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (onProgress) {
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  updateDocument: async (id, documentData) => {
    const response = await api.put(`/documents/${id}`, documentData);
    return response.data;
  },

  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  // Version control
  getVersions: async (documentId) => {
    const response = await api.get(`/versions/${documentId}`);
    return response.data;
  },

  createVersion: async (documentId, formData) => {
    const response = await api.post(`/versions/${documentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getVersion: async (documentId, versionId) => {
    const response = await api.get(`/versions/${documentId}/${versionId}`);
    return response.data;
  },

  setCurrentVersion: async (documentId, versionId) => {
    const response = await api.put(`/versions/${documentId}/current/${versionId}`);
    return response.data;
  },

  compareVersions: async (documentId, version1Id, version2Id) => {
    const response = await api.get(
      `/versions/${documentId}/compare/${version1Id}/${version2Id}`
    );
    return response.data;
  },

  // Sections
  getSections: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/sections`);
    return response.data;
  },

  getSection: async (documentId, sectionId) => {
    const response = await api.get(`/documents/${documentId}/sections/${sectionId}`);
    return response.data;
  },

  // Annotations
  getAnnotations: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/annotations`);
    return response.data;
  },

  createAnnotation: async (documentId, annotationData) => {
    const response = await api.post(
      `//documents/${documentId}/annotations`,
      annotationData
    );
    return response.data;
  },

  updateAnnotation: async (documentId, annotationId, annotationData) => {
    const response = await api.put(
      `/documents/${documentId}/annotations/${annotationId}`,
      annotationData
    );
    return response.data;
  },

  deleteAnnotation: async (documentId, annotationId) => {
    const response = await api.delete(
      `/documents/${documentId}/annotations/${annotationId}`
    );
    return response.data;
  },
};

export default documentService;
