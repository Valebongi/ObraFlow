import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import WorkOrdersPage from '@/pages/work-orders/WorkOrdersPage';
import WorkOrderCreatePage from '@/pages/work-orders/WorkOrderCreatePage';
import WorkOrderDetailPage from '@/pages/work-orders/WorkOrderDetailPage';
import PlanningPage from '@/pages/PlanningPage';
import ClientsPage from '@/pages/ClientsPage';
import ContractsPage from '@/pages/ContractsPage';
import LocationsPage from '@/pages/LocationsPage';
import CrewsPage from '@/pages/CrewsPage';
import WorkersPage from '@/pages/WorkersPage';
import SubcontractorsPage from '@/pages/SubcontractorsPage';
import VehiclesPage from '@/pages/VehiclesPage';
import MaterialsPage from '@/pages/MaterialsPage';
import TimesheetsPage from '@/pages/TimesheetsPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import PortalAccessPage from '@/pages/PortalAccessPage';

import PortalLoginPage from '@/pages/portal/PortalLoginPage';
import PortalWorkOrdersPage from '@/pages/portal/PortalWorkOrdersPage';
import PortalWorkOrderDetailPage from '@/pages/portal/PortalWorkOrderDetailPage';
import { PortalProtectedRoute, PortalLayout } from '@/pages/portal/PortalLayout';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/portal/login', element: <PortalLoginPage /> },

  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'work-orders', element: <WorkOrdersPage /> },
      { path: 'work-orders/create', element: <WorkOrderCreatePage /> },
      { path: 'work-orders/:id', element: <WorkOrderDetailPage /> },
      { path: 'planning', element: <PlanningPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'contracts', element: <ContractsPage /> },
      { path: 'locations', element: <LocationsPage /> },
      { path: 'crews', element: <CrewsPage /> },
      { path: 'workers', element: <WorkersPage /> },
      { path: 'subcontractors', element: <SubcontractorsPage /> },
      { path: 'vehicles', element: <VehiclesPage /> },
      { path: 'materials', element: <MaterialsPage /> },
      { path: 'timesheets', element: <TimesheetsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'portal-access', element: <PortalAccessPage /> },
    ],
  },

  {
    path: '/portal',
    element: (
      <PortalProtectedRoute>
        <PortalLayout />
      </PortalProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/portal/work-orders" replace /> },
      { path: 'work-orders', element: <PortalWorkOrdersPage /> },
      { path: 'work-orders/:id', element: <PortalWorkOrderDetailPage /> },
    ],
  },

  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
