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
import { useOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

const USE_DEMO_RUNTIME = import.meta.env.VITE_OKTAVIUS_RUNTIME === 'demo';

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

function DemoProtectedRoute({
  routeId,
  children,
}: {
  routeId: AppNavRouteId;
  children: ReactNode;
}) {
  const { activeMembership, currentUser } = useDemoData();
  const item = APP_NAV_MODULES.find((entry) => entry.id === routeId);
  const canAccess =
    item != null && canAccessAppNavItem(item, permissionSubjectFor(currentUser, activeMembership));

  return canAccess ? children : pageElement(AccessDeniedPage);
}

function OsirisProtectedRoute({
  routeId,
  children,
}: {
  routeId: AppNavRouteId;
  children: ReactNode;
}) {
  const { permissionSubject, isLoading, error, reload } = useOsirisRuntime();

  if (isLoading) {
    return <AppShellSpinner label="Loading access…" />;
  }

  if (error) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-6">
        <div className="max-w-md rounded-card border border-border bg-card p-5 text-card-foreground shadow-sm">
          <h2 className="text-base font-semibold">Unable to load access</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <button
            type="button"
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => {
              void reload();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const item = APP_NAV_MODULES.find((entry) => entry.id === routeId);
  const canAccess = item != null && canAccessAppNavItem(item, permissionSubject);

  return canAccess ? children : pageElement(AccessDeniedPage);
}

function ProtectedRoute({ routeId, children }: { routeId: AppNavRouteId; children: ReactNode }) {
  const RuntimeProtectedRoute = USE_DEMO_RUNTIME ? DemoProtectedRoute : OsirisProtectedRoute;
  return <RuntimeProtectedRoute routeId={routeId}>{children}</RuntimeProtectedRoute>;
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
const EmailPage = lazyPage(() => import('@/modules/email/EmailPage'), 'EmailPage');
const ProfilePage = lazyPage(() => import('@/modules/profile/ProfilePage'), 'ProfilePage');
const ReportsPage = lazyPage(() => import('@/modules/reports/ReportsPage'), 'ReportsPage');
const SettingsPage = lazyPage(() => import('@/modules/settings/SettingsPage'), 'SettingsPage');
const ComponentShowcasePage = lazyPage(
  () => import('@/modules/showcase/ComponentShowcasePage'),
  'ComponentShowcasePage',
);

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
          { path: '/email', element: pageElement(EmailPage) },
          { path: '/calendar', element: pageElement(CalendarPage) },
          { path: '/access-denied', element: pageElement(AccessDeniedPage) },
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
