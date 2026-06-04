import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';

import { useDemoData } from '@/app/demo-data';
import { AgentPageContextProvider } from '@/components/agent/page-context';
import { CommandPaletteProvider } from '@/components/command/CommandPalette';
import { RouteErrorPage } from '@/components/errors/AppErrorPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppShellSpinner } from '@/components/layout/AppShellSpinner';
import { ShortcutHelpProvider } from '@/components/layout/ShortcutHelpProvider';
import { APP_NAV_MODULES, type AppNavRouteId } from '@/lib/appNavModules';
import { canAccessAppNavItem, permissionSubjectFor } from '@/lib/permissions';

function lazyPage<TModule extends Record<TExport, ComponentType>, TExport extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TExport,
) {
  return lazy(async () => ({
    default: (await loader())[exportName],
  }));
}

function pageElement(Page: ComponentType) {
  return (
    <Suspense fallback={<AppShellSpinner label="Loading page…" />}>
      <Page />
    </Suspense>
  );
}

function ProtectedRoute({ routeId, children }: { routeId: AppNavRouteId; children: ReactNode }) {
  const { activeMembership, currentUser } = useDemoData();
  const item = APP_NAV_MODULES.find((entry) => entry.id === routeId);
  const canAccess =
    item != null && canAccessAppNavItem(item, permissionSubjectFor(currentUser, activeMembership));

  return canAccess ? children : pageElement(AccessDeniedPage);
}

function protectedPageElement(routeId: AppNavRouteId, Page: ComponentType) {
  return <ProtectedRoute routeId={routeId}>{pageElement(Page)}</ProtectedRoute>;
}

const AccessDeniedPage = lazyPage(
  () => import('@/components/common/AccessDeniedPage'),
  'AccessDeniedPage',
);
const AppNotFoundPage = lazyPage(
  () => import('@/components/common/AppNotFoundPage'),
  'AppNotFoundPage',
);
const AIChatPage = lazyPage(() => import('@/modules/ai-chat/AIChatPage'), 'AIChatPage');
const CalendarPage = lazyPage(() => import('@/modules/calendar/CalendarPage'), 'CalendarPage');
const DashboardPage = lazyPage(() => import('@/modules/dashboard/DashboardPage'), 'DashboardPage');
const DocumentsPage = lazyPage(() => import('@/modules/documents/DocumentsPage'), 'DocumentsPage');
const EmailPage = lazyPage(() => import('@/modules/email/EmailPage'), 'EmailPage');
const ProfilePage = lazyPage(() => import('@/modules/profile/ProfilePage'), 'ProfilePage');
const ReportsPage = lazyPage(() => import('@/modules/reports/ReportsPage'), 'ReportsPage');
const SettingsPage = lazyPage(() => import('@/modules/settings/SettingsPage'), 'SettingsPage');
const ComponentShowcasePage = lazyPage(
  () => import('@/modules/showcase/ComponentShowcasePage'),
  'ComponentShowcasePage',
);
const OrganizationCreatePage = lazyPage(
  () => import('@/modules/superadmin/OrganizationCreatePage'),
  'OrganizationCreatePage',
);
const OrganizationDetailPage = lazyPage(
  () => import('@/modules/superadmin/OrganizationDetailPage'),
  'OrganizationDetailPage',
);
const SuperadminPage = lazyPage(
  () => import('@/modules/superadmin/SuperadminPage'),
  'SuperadminPage',
);
const TasksPage = lazyPage(() => import('@/modules/tasks/TasksPage'), 'TasksPage');

function AppRootProviders() {
  return (
    <AgentPageContextProvider>
      <ShortcutHelpProvider>
        <CommandPaletteProvider>
          <Outlet />
        </CommandPaletteProvider>
      </ShortcutHelpProvider>
    </AgentPageContextProvider>
  );
}

const appRouter = createBrowserRouter([
  {
    element: <AppRootProviders />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: pageElement(DashboardPage) },
          { path: '/reports', element: pageElement(ReportsPage) },
          { path: '/ai-chat', element: pageElement(AIChatPage) },
          {
            path: '/showcase',
            element: import.meta.env.DEV ? (
              protectedPageElement('showcase', ComponentShowcasePage)
            ) : (
              <Navigate to="/dashboard" replace />
            ),
          },
          { path: '/profile', element: pageElement(ProfilePage) },
          { path: '/settings', element: protectedPageElement('settings', SettingsPage) },
          { path: '/superadmin', element: protectedPageElement('superadmin', SuperadminPage) },
          {
            path: '/superadmin/orgs/new',
            element: protectedPageElement('superadmin', OrganizationCreatePage),
          },
          {
            path: '/superadmin/orgs/:orgId',
            element: protectedPageElement('superadmin', OrganizationDetailPage),
          },
          { path: '/tasks', element: pageElement(TasksPage) },
          { path: '/documents', element: pageElement(DocumentsPage) },
          { path: '/email', element: pageElement(EmailPage) },
          { path: '/calendar', element: pageElement(CalendarPage) },
          { path: '/access-denied', element: pageElement(AccessDeniedPage) },
          { path: '/storage', element: pageElement(DocumentsPage) },
          { path: '*', element: pageElement(AppNotFoundPage) },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return (
    <NuqsAdapter>
      <RouterProvider router={appRouter} />
    </NuqsAdapter>
  );
}
