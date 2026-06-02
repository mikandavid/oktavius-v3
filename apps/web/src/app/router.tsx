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
const AIChatPage = lazyPage(() => import('@/modules/ai-chat/AIChatPage'), 'AIChatPage');
const CalendarPage = lazyPage(() => import('@/modules/calendar/CalendarPage'), 'CalendarPage');
const CaseCreatePage = lazyPage(() => import('@/modules/cases/CaseCreatePage'), 'CaseCreatePage');
const CaseDetailPage = lazyPage(() => import('@/modules/cases/CaseDetailPage'), 'CaseDetailPage');
const CaseEditPage = lazyPage(() => import('@/modules/cases/CaseEditPage'), 'CaseEditPage');
const CasesBoardPage = lazyPage(() => import('@/modules/cases/CasesBoardPage'), 'CasesBoardPage');
const CasesListPage = lazyPage(() => import('@/modules/cases/CasesListPage'), 'CasesListPage');
const ClientCreatePage = lazyPage(
  () => import('@/modules/clients/ClientCreatePage'),
  'ClientCreatePage',
);
const ClientDetailPage = lazyPage(
  () => import('@/modules/clients/ClientDetailPage'),
  'ClientDetailPage',
);
const ClientEditPage = lazyPage(() => import('@/modules/clients/ClientEditPage'), 'ClientEditPage');
const ClientOnboardingPage = lazyPage(
  () => import('@/modules/clients/ClientOnboardingPage'),
  'ClientOnboardingPage',
);
const ClientsListPage = lazyPage(
  () => import('@/modules/clients/ClientsListPage'),
  'ClientsListPage',
);
const ContractDetailPage = lazyPage(
  () => import('@/modules/contracts/ContractDetailPage'),
  'ContractDetailPage',
);
const ContractsListPage = lazyPage(
  () => import('@/modules/contracts/ContractsListPage'),
  'ContractsListPage',
);
const DashboardPage = lazyPage(() => import('@/modules/dashboard/DashboardPage'), 'DashboardPage');
const DocumentsPage = lazyPage(() => import('@/modules/documents/DocumentsPage'), 'DocumentsPage');
const EmailPage = lazyPage(() => import('@/modules/email/EmailPage'), 'EmailPage');
const IncidentDetailPage = lazyPage(
  () => import('@/modules/incidents/IncidentDetailPage'),
  'IncidentDetailPage',
);
const IncidentsListPage = lazyPage(
  () => import('@/modules/incidents/IncidentsListPage'),
  'IncidentsListPage',
);
const InvoiceDetailPage = lazyPage(
  () => import('@/modules/invoices/InvoiceDetailPage'),
  'InvoiceDetailPage',
);
const InvoicesListPage = lazyPage(
  () => import('@/modules/invoices/InvoicesListPage'),
  'InvoicesListPage',
);
const OrderDetailPage = lazyPage(
  () => import('@/modules/orders/OrderDetailPage'),
  'OrderDetailPage',
);
const OrdersListPage = lazyPage(() => import('@/modules/orders/OrdersListPage'), 'OrdersListPage');
const ProductCreatePage = lazyPage(
  () => import('@/modules/products/ProductCreatePage'),
  'ProductCreatePage',
);
const ProductDetailPage = lazyPage(
  () => import('@/modules/products/ProductDetailPage'),
  'ProductDetailPage',
);
const ProductEditPage = lazyPage(
  () => import('@/modules/products/ProductEditPage'),
  'ProductEditPage',
);
const ProductsListPage = lazyPage(
  () => import('@/modules/products/ProductsListPage'),
  'ProductsListPage',
);
const ProjectDetailPage = lazyPage(
  () => import('@/modules/projects/ProjectDetailPage'),
  'ProjectDetailPage',
);
const ProjectsListPage = lazyPage(
  () => import('@/modules/projects/ProjectsListPage'),
  'ProjectsListPage',
);
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
const UserCreatePage = lazyPage(() => import('@/modules/users/UserCreatePage'), 'UserCreatePage');
const UserDetailPage = lazyPage(() => import('@/modules/users/UserDetailPage'), 'UserDetailPage');
const UserEditPage = lazyPage(() => import('@/modules/users/UserEditPage'), 'UserEditPage');
const UsersListPage = lazyPage(() => import('@/modules/users/UsersListPage'), 'UsersListPage');

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
          { path: '/users', element: protectedPageElement('users', UsersListPage) },
          { path: '/users/new', element: protectedPageElement('users', UserCreatePage) },
          { path: '/users/:userId', element: protectedPageElement('users', UserDetailPage) },
          { path: '/users/:userId/edit', element: protectedPageElement('users', UserEditPage) },
          { path: '/clients', element: pageElement(ClientsListPage) },
          { path: '/clients/new', element: pageElement(ClientCreatePage) },
          { path: '/clients/onboarding', element: pageElement(ClientOnboardingPage) },
          { path: '/clients/:clientId', element: pageElement(ClientDetailPage) },
          { path: '/clients/:clientId/edit', element: pageElement(ClientEditPage) },
          { path: '/cases', element: pageElement(CasesListPage) },
          { path: '/cases/board', element: pageElement(CasesBoardPage) },
          { path: '/cases/new', element: pageElement(CaseCreatePage) },
          { path: '/cases/:caseId', element: pageElement(CaseDetailPage) },
          { path: '/cases/:caseId/edit', element: pageElement(CaseEditPage) },
          { path: '/incidents', element: pageElement(IncidentsListPage) },
          { path: '/incidents/:incidentId', element: pageElement(IncidentDetailPage) },
          { path: '/contracts', element: pageElement(ContractsListPage) },
          { path: '/contracts/:contractId', element: pageElement(ContractDetailPage) },
          { path: '/orders', element: pageElement(OrdersListPage) },
          { path: '/orders/:orderId', element: pageElement(OrderDetailPage) },
          { path: '/invoices', element: pageElement(InvoicesListPage) },
          { path: '/invoices/:invoiceId', element: pageElement(InvoiceDetailPage) },
          { path: '/products', element: pageElement(ProductsListPage) },
          { path: '/products/new', element: pageElement(ProductCreatePage) },
          { path: '/products/:productId', element: pageElement(ProductDetailPage) },
          { path: '/products/:productId/edit', element: pageElement(ProductEditPage) },
          { path: '/projects', element: pageElement(ProjectsListPage) },
          { path: '/projects/:projectId', element: pageElement(ProjectDetailPage) },
          { path: '/tasks', element: pageElement(TasksPage) },
          { path: '/documents', element: pageElement(DocumentsPage) },
          { path: '/email', element: pageElement(EmailPage) },
          { path: '/calendar', element: pageElement(CalendarPage) },
          { path: '/access-denied', element: pageElement(AccessDeniedPage) },
          { path: '/funeral/cases', element: pageElement(CasesListPage) },
          { path: '/funeral/cases/board', element: pageElement(CasesBoardPage) },
          { path: '/funeral/cases/new', element: pageElement(CaseCreatePage) },
          { path: '/funeral/cases/:caseId', element: pageElement(CaseDetailPage) },
          { path: '/funeral/cases/:caseId/edit', element: pageElement(CaseEditPage) },
          { path: '/contacts', element: pageElement(ClientsListPage) },
          { path: '/contacts/new', element: pageElement(ClientCreatePage) },
          { path: '/contacts/:clientId', element: pageElement(ClientDetailPage) },
          { path: '/contacts/:clientId/edit', element: pageElement(ClientEditPage) },
          { path: '/catalog', element: pageElement(ProductsListPage) },
          { path: '/catalog/new', element: pageElement(ProductCreatePage) },
          { path: '/catalog/:productId', element: pageElement(ProductDetailPage) },
          { path: '/catalog/:productId/edit', element: pageElement(ProductEditPage) },
          { path: '/storage', element: pageElement(DocumentsPage) },
          { path: '/sales', element: pageElement(OrdersListPage) },
          { path: '/sales/:orderId', element: pageElement(OrderDetailPage) },
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
