import { QueryClientProvider } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useMemo } from 'react';

import type { ApiRegistry } from './contracts';
import { createAppQueryClient } from './queryClient';

export type { ApiRegistry } from './contracts';

type ApiContextValue = {
  registry: ApiRegistry;
};

const ApiContext = createContext<ApiContextValue | null>(null);

const queryClient = createAppQueryClient();

type ApiProviderProps = {
  children: ReactNode;
  registry: ApiRegistry;
};

export function ApiProvider({ children, registry }: ApiProviderProps) {
  const value = useMemo(() => ({ registry }), [registry]);

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

export function useOptionalApiRegistry() {
  return useContext(ApiContext)?.registry ?? null;
}
