import { createContext, useContext } from 'react';

import type { OsirisRuntimeState } from './types';

export type OsirisRuntimeContextValue = OsirisRuntimeState & {
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

export const OsirisRuntimeContext = createContext<OsirisRuntimeContextValue | null>(null);

export function useOptionalOsirisRuntime() {
  return useContext(OsirisRuntimeContext);
}

export function useOsirisRuntime() {
  const context = useContext(OsirisRuntimeContext);
  if (!context) {
    throw new Error('useOsirisRuntime must be used inside OsirisAuthProvider');
  }
  return context;
}
