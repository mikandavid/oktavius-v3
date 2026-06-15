import * as Sentry from '@sentry/react';

import { AppErrorPage } from '@/components/errors/AppErrorPage';

import { AppRouter } from './router';
import { RuntimeProviders } from './runtimeProviders';

export function App() {
  return (
    <Sentry.ErrorBoundary fallback={({ error }) => <AppErrorPage error={error} />}>
      <RuntimeProviders>
        <AppRouter />
      </RuntimeProviders>
    </Sentry.ErrorBoundary>
  );
}
