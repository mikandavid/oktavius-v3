import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

import { Button } from '@oktavius/base-ui';

import { getChunkLoadRecoveryState, registerChunkLoadReload } from '@/lib/chunkLoadRecovery';

type AppErrorPageProps = {
  error?: unknown;
};

export function AppErrorPage({ error }: AppErrorPageProps) {
  const recoveryState = getChunkLoadRecoveryState(error);

  useEffect(() => {
    if (isRouteErrorResponse(error)) {
      console.error('[router] Route error response', {
        status: error.status,
        statusText: error.statusText,
        data: error.data,
      });
      return;
    }

    if (error instanceof Error) {
      console.error('[router] Route render error', error);
      return;
    }

    if (error !== undefined) {
      console.error('[router] Unknown route error', error);
    }
  }, [error]);

  useEffect(() => {
    if (!recoveryState.shouldAutoReload || !registerChunkLoadReload()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.location.reload();
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [recoveryState.shouldAutoReload]);

  const isReloading = recoveryState.shouldAutoReload;

  let errorMessage = 'An unexpected error occurred.';
  let errorDetails: string | undefined;

  if (isRouteErrorResponse(error)) {
    const routeData =
      error.data && typeof error.data === 'object' && 'message' in error.data
        ? error.data.message
        : undefined;

    errorMessage = error.statusText || routeData || `Error ${error.status}`;
    errorDetails =
      error.data && typeof error.data === 'object' && 'details' in error.data
        ? String(error.data.details)
        : undefined;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack;
  }

  if (recoveryState.isChunkLoadError) {
    errorMessage = recoveryState.shouldAutoReload
      ? 'The app was updated. Reloading now…'
      : 'The app was updated, but this page could not be restored automatically.';
  }

  const returnToLastPage = () => {
    if (recoveryState.lastHealthyUrl) {
      window.location.assign(recoveryState.lastHealthyUrl);
      return;
    }
    window.location.assign('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-card border border-border/50 bg-card p-6">
        <h1 className="mb-4 text-2xl font-bold text-destructive">Something went wrong</h1>
        <p className="mb-4 text-foreground">{errorMessage}</p>
        {recoveryState.hasExceededAutoReloads ? (
          <p className="mb-4 text-sm text-muted-foreground">
            Return to your last page or reload again.
          </p>
        ) : null}
        {errorDetails &&
        (import.meta as ImportMeta & { env?: Record<string, string> }).env?.MODE ===
          'development' ? (
          <details className="mb-4">
            <summary className="mb-2 cursor-pointer text-sm text-muted-foreground">
              Error details
            </summary>
            <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">
              {errorDetails}
            </pre>
          </details>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => window.location.reload()} disabled={isReloading}>
            Reload page
          </Button>
          {recoveryState.lastHealthyUrl ? (
            <Button variant="outline" onClick={returnToLastPage} disabled={isReloading}>
              Return to last page
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => window.location.assign('/')}
            disabled={isReloading}
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RouteErrorPage() {
  const error = useRouteError();
  return <AppErrorPage error={error} />;
}
