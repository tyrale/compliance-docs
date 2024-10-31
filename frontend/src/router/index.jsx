import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Documents from '../pages/Documents';
import DocumentView from '../pages/DocumentView';
import Search from '../pages/Search';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'documents',
        element: (
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        ),
      },
      {
        path: 'documents/:id',
        element: (
          <ProtectedRoute>
            <DocumentView />
          </ProtectedRoute>
        ),
      },
      {
        path: 'search',
        element: (
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
