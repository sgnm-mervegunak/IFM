import { useRoutes, Navigate } from 'react-router-dom';

//layouts
import AppLayout from './layouts/App/App';

//pages
import Dashboard from './layouts/App/components/Dashboard';
import Facility from './pages/Facility';
import { NotFound } from './layouts/App/pages/NotFound';
import CrudDemo from './layouts/App/pages/CrudDemo';
// import Main from './pages/Main';

export default function Router() {
  return useRoutes([
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { path: '', element: <Dashboard /> },
        { path: 'facility', element: <Facility /> },
        { path: 'crud', element: <CrudDemo /> },
      ],
    },
    {
      path: '/404',
      element: <NotFound />,
    },
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}