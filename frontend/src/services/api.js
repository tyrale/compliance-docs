import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance with enhanced configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000,
  keepAlive: true,
  decompress: true,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.url?.includes('/documents') && config.method === 'post') {
      config.timeout = 300000;
      config.maxContentLength = Infinity;
      config.maxBodyLength = Infinity;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again.';
    }
    
    if (!error.response) {
      error.message = 'Network error. Please check your connection and try again.';
    }
    
    if (error.response?.status >= 500) {
      error.message = 'Server error. Please try again later.';
    }
    
    return Promise.reject(error);
  }
);

// Document endpoints
export const getDocument = (id) => api.get(`/documents/${id}`);
export const getDocuments = () => api.get('/documents');
export const uploadDocument = (formData) => {
  return api.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const updateDocument = (id, data) => api.put(`/documents/${id}`, data);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);

export default api;
