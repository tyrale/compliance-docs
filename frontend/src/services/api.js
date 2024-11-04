import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth endpoints
export const login = (credentials) => api.post('/users/login', credentials);
export const register = (userData) => api.post('/users/register', userData);
export const updateProfile = (userData, token) => api.put('/users/profile', userData, {
  headers: { Authorization: `Bearer ${token}` }
});

// Document endpoints
export const getDocuments = () => api.get('/documents');
export const getDocument = (id) => api.get(`/documents/${id}`);
export const uploadDocument = (formData) => api.post('/documents/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateDocument = (id, data) => api.put(`/documents/${id}`, data);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);

// Search endpoints
export const searchDocuments = (query) => api.get(`/search?q=${encodeURIComponent(query)}`);
export const getSearchHistory = () => api.get('/search/history');

// Version endpoints
export const getVersions = (documentId) => api.get(`/versions/${documentId}`);
export const createVersion = (documentId, versionData) => api.post(`/versions/${documentId}`, versionData);

// Section endpoints
export const getSections = (documentId) => api.get(`/sections/${documentId}`);
export const createSection = (documentId, sectionData) => api.post(`/sections/${documentId}`, sectionData);
export const updateSection = (sectionId, sectionData) => api.put(`/sections/${sectionId}`, sectionData);
export const deleteSection = (sectionId) => api.delete(`/sections/${sectionId}`);

// Export the axios instance as default
export default api;
