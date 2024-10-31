import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  documents: [],
  currentDocument: null,
  versions: [],
  currentVersion: null,
  sections: [],
  annotations: [],
  loading: false,
  error: null,
};

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setDocuments: (state, action) => {
      state.documents = action.payload;
      state.loading = false;
    },
    setCurrentDocument: (state, action) => {
      state.currentDocument = action.payload;
      state.loading = false;
    },
    setVersions: (state, action) => {
      state.versions = action.payload;
      state.loading = false;
    },
    setCurrentVersion: (state, action) => {
      state.currentVersion = action.payload;
      state.loading = false;
    },
    setSections: (state, action) => {
      state.sections = action.payload;
      state.loading = false;
    },
    setAnnotations: (state, action) => {
      state.annotations = action.payload;
      state.loading = false;
    },
    addAnnotation: (state, action) => {
      state.annotations.push(action.payload);
    },
    updateAnnotation: (state, action) => {
      const index = state.annotations.findIndex(
        (annotation) => annotation.id === action.payload.id
      );
      if (index !== -1) {
        state.annotations[index] = action.payload;
      }
    },
    deleteAnnotation: (state, action) => {
      state.annotations = state.annotations.filter(
        (annotation) => annotation.id !== action.payload
      );
    },
    clearDocumentState: (state) => {
      state.currentDocument = null;
      state.versions = [];
      state.currentVersion = null;
      state.sections = [];
      state.annotations = [];
    },
  },
});

export const {
  setLoading,
  setError,
  setDocuments,
  setCurrentDocument,
  setVersions,
  setCurrentVersion,
  setSections,
  setAnnotations,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  clearDocumentState,
} = documentSlice.actions;

export default documentSlice.reducer;
