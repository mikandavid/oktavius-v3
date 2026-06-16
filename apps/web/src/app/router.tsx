import * as Sentry from '@sentry/react';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { type ComponentType, lazy, type ReactNode, Suspense, useEffect, useRef } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  type RouteObject,
  RouterProvider,
  useLocation,
} from 'react-router-dom';

import { AgentPageContextProvider } from '@/components/agent/page-context';
import { CommandPaletteProvider } from '@/components/command/CommandPalette';
import { RouteErrorPage } from '@/components/errors/AppErrorPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppShellSpinner } from '@/components/layout/AppShellSpinner';
import { ShortcutHelpProvider } from '@/components/layout/ShortcutHelpProvider';
import { ModuleErrorBoundary } from '@/core/errors/ModuleErrorBoundary';
import { APP_NAV_MODULES, type AppNavModule, type AppNavRouteId } from '@/lib/appNavModules';
import { setLastHealthyLocation } from '@/lib/chunkLoadRecovery';
import { canAccessAppNavItem } from '@/lib/permissions';
import { OsirisAccessGate } from '@/runtime/osiris/OsirisAccessGate';
import { useOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

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

function modulePageElement(moduleId: string, Page: ComponentType) {
  return <ModuleErrorBoundary moduleId={moduleId}>{pageElement(Page)}</ModuleErrorBoundary>;
}

function ProtectedRoute({ routeId, children }: { routeId: AppNavRouteId; children: ReactNode }) {
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

function protectedPageElement(routeId: AppNavRouteId, Page: ComponentType) {
  return (
    <ModuleErrorBoundary moduleId={routeId}>
      <ProtectedRoute routeId={routeId}>{pageElement(Page)}</ProtectedRoute>
    </ModuleErrorBoundary>
  );
}

const AccessDeniedPage = lazyPage(
  () => import('@/components/common/AccessDeniedPage'),
  'AccessDeniedPage',
);
const AppNotFoundPage = lazyPage(
  () => import('@/components/common/AppNotFoundPage'),
  'AppNotFoundPage',
);
const LoginPage = lazyPage(() => import('@/modules/auth/LoginPage'), 'LoginPage');
const ForgotPasswordPage = lazyPage(
  () => import('@/modules/auth/AuthPlaceholderPage'),
  'ForgotPasswordPage',
);
const ResetPasswordPage = lazyPage(
  () => import('@/modules/auth/AuthPlaceholderPage'),
  'ResetPasswordPage',
);
const SignUpPage = lazyPage(() => import('@/modules/auth/AuthPlaceholderPage'), 'SignUpPage');
const AuthCallbackPage = lazyPage(
  () => import('@/modules/auth/AuthPlaceholderPage'),
  'AuthCallbackPage',
);
const InvitePage = lazyPage(() => import('@/modules/auth/AuthPlaceholderPage'), 'InvitePage');

/** One lazy component per manifest entry; created once at module scope so Vite splits chunks. */
const MODULE_PAGES = new Map(
  APP_NAV_MODULES.map((module) => [module.id, lazyPage(module.loadPage, module.pageExport)]),
);

function moduleRouteElement(module: AppNavModule) {
  const Page = MODULE_PAGES.get(module.id)!;

  if (module.devOnly && !import.meta.env.DEV) {
    return <Navigate to="/dashboard" replace />;
  }

  if (module.permission || module.superadminOnly) {
    return protectedPageElement(module.id, Page);
  }

  return modulePageElement(module.id, Page);
}

/**
 * Records the last successfully-rendered URL so a later chunk-load failure can
 * offer "Return to last page". Tracks the *previous* healthy URL: the current
 * one isn't yet known to render cleanly when this effect runs.
 */
function NavigationRecoveryTracker() {
  const location = useLocation();
  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUrl = window.location.href;
    if (previousUrlRef.current && previousUrlRef.current !== currentUrl) {
      setLastHealthyLocation(previousUrlRef.current);
    }
    previousUrlRef.current = currentUrl;
  }, [location.key, location.pathname, location.search, location.hash]);

  return null;
}

function AppRootProviders() {
  return (
    <AgentPageContextProvider>
      <ShortcutHelpProvider>
        <CommandPaletteProvider>
          <NavigationRecoveryTracker />
          <Outlet />
        </CommandPaletteProvider>
      </ShortcutHelpProvider>
    </AgentPageContextProvider>
  );
}

// Sentry-instrumented router factory: captures route-level traces and errors.
// No-op when Sentry is disabled (no DSN).
const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouterV6(createBrowserRouter);

export const PROTECTED_ROUTE_CHILDREN: RouteObject[] = [
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  ...APP_NAV_MODULES.map((module) => ({
    path: module.path,
    element: moduleRouteElement(module),
  })),
  { path: '/members', element: <Navigate to="/settings?section=people" replace /> },
  { path: '/profile', element: <Navigate to="/settings?section=account" replace /> },
  { path: '/access-denied', element: modulePageElement('access-denied', AccessDeniedPage) },
  { path: '*', element: modulePageElement('not-found', AppNotFoundPage) },
];

const appRouter = sentryCreateBrowserRouter([
  {
    element: <AppRootProviders />,
    children: [
      { path: '/login', element: pageElement(LoginPage) },
      { path: '/forgot-password', element: pageElement(ForgotPasswordPage) },
      { path: '/reset-password', element: pageElement(ResetPasswordPage) },
      { path: '/signup', element: pageElement(SignUpPage) },
      { path: '/auth/callback', element: pageElement(AuthCallbackPage) },
      { path: '/invite/:token', element: pageElement(InvitePage) },
      {
        element: (
          <OsirisAccessGate>
            <AppLayout />
          </OsirisAccessGate>
        ),
        errorElement: <RouteErrorPage />,
        children: PROTECTED_ROUTE_CHILDREN,
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
