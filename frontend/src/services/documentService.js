import api from './api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    let attempt = 0;
    
    while (attempt < MAX_RETRIES) {
      try {
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
          // Increase max content length and request size
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          // Enable keep-alive
          keepAlive: true,
          // Enable compression
          decompress: true,
        });
        return response.data;
      } catch (error) {
        attempt++;
        
        // If we've exhausted all retries, throw the error
        if (attempt === MAX_RETRIES) {
          throw error;
        }

        // If it's a timeout or network error, wait and retry
        if (error.code === 'ECONNABORTED' || error.message.includes('network')) {
          await sleep(RETRY_DELAY);
          // Reset progress before retry
          if (onProgress) {
            onProgress(0);
          }
          continue;
        }

        // For other errors, throw immediately
        throw error;
      }
    }
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
    const response = await api.get(`/documents/${documentId}/versions`);
    return response.data;
  },

  createVersion: async (documentId, formData) => {
    const response = await api.post(`/documents/${documentId}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return response.data;
  },

  getVersion: async (documentId, versionId) => {
    const response = await api.get(`/documents/${documentId}/versions/${versionId}`);
    return response.data;
  },

  setCurrentVersion: async (documentId, versionId) => {
    const response = await api.put(`/documents/${documentId}/versions/${versionId}/current`);
    return response.data;
  },

  compareVersions: async (documentId, version1Id, version2Id) => {
    const response = await api.get(
      `/documents/${documentId}/versions/compare?version1Id=${version1Id}&version2Id=${version2Id}`
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
      `/documents/${documentId}/annotations`,
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
