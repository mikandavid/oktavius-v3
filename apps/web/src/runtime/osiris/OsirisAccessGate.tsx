import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { Button } from '@oktavius/base-ui';

import { AppShellSpinner } from '@/components/layout/AppShellSpinner';
import { OrganizationIcon, RefreshIcon, WarningIcon } from '@/lib/icons';

import { useOsirisRuntime } from './useOsirisRuntime';

function FullScreenState({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}

function NoOrganizationState() {
  return (
    <FullScreenState>
      <div className="rounded-card bg-card p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-control bg-muted text-muted-foreground">
          <OrganizationIcon size={24} weight="duotone" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">No workspace assigned</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your account is active, but it is not assigned to a workspace yet. Ask your workspace
          administrator to send an invitation, or contact Oktavius support if you expected access.
        </p>
        <div className="mt-5">
          <a
            href="mailto:hi@oktavius.ai"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Contact Oktavius support
          </a>
        </div>
      </div>
    </FullScreenState>
  );
}

function BootstrapErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <FullScreenState>
      <div className="rounded-card bg-card p-6 text-center">
        <WarningIcon
          size={42}
          className="mx-auto mb-4 text-destructive"
          weight="duotone"
          aria-hidden="true"
        />
        <h1 className="text-lg font-semibold text-foreground">Unable to load workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button type="button" className="mt-5" onClick={onRetry}>
          <RefreshIcon size={16} aria-hidden="true" />
          Retry
        </Button>
      </div>
    </FullScreenState>
  );
}

export function OsirisAccessGate({ children }: { children: ReactNode }) {
  const runtime = useOsirisRuntime();
  const location = useLocation();

  if (runtime.isLoading) {
    return (
      <FullScreenState>
        <AppShellSpinner label="Loading workspace…" />
      </FullScreenState>
    );
  }

  const sessionStatus = runtime.sessionStatus ?? 'authenticated';
  if (sessionStatus === 'anonymous' || sessionStatus === 'expired') {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (runtime.error) {
    return (
      <BootstrapErrorState
        error={runtime.error}
        onRetry={() => {
          void runtime.reload();
        }}
      />
    );
  }

  const hasOrganization = runtime.organizations.length > 0;
  if (!runtime.permissionSubject.isSuperadmin && !hasOrganization) {
    return <NoOrganizationState />;
  }

  return <>{children}</>;
}
