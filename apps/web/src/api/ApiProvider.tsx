import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { DemoApiRegistry } from './demo-client';

type ApiContextValue = {
  registry: DemoApiRegistry;
};

const ApiContext = createContext<ApiContextValue | null>(null);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

type ApiProviderProps = {
  children: ReactNode;
  demoRegistry: DemoApiRegistry;
};

export function ApiProvider({ children, demoRegistry }: ApiProviderProps) {
  const value = useMemo(() => ({ registry: demoRegistry }), [demoRegistry]);

  return (
    <ApiContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiContext.Provider>
  );
}

export function useApiRegistry() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApiRegistry must be used inside ApiProvider');
  }
  return context.registry;
}
