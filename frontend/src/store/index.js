import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import documentReducer from './slices/documentSlice';
import searchReducer from './slices/searchSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentReducer,
    search: searchReducer,
  },
});
