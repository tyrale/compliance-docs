import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Documents from '../pages/Documents';
import DocumentView from '../pages/DocumentView';
import Search from '../pages/Search';
import NotFound from '../pages/NotFound';
import Dashboard from '../pages/Dashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/documents',
        element: <Documents />,
      },
      {
        path: '/documents/:id',
        element: <DocumentView />,
      },
      {
        path: '/search',
        element: <Search />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
