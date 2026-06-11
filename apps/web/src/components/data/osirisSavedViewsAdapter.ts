import type { SavedViewsRuntimeAdapter } from './savedViewsRuntime';

export function createOsirisSavedViewsAdapter(): SavedViewsRuntimeAdapter {
  return {
    // TODO(osiris): wire to backend saved-view endpoints once the API contract exists.
    fetchViews: async () => [],
    persistView: async () => undefined,
    deleteView: async () => undefined,
    shareView: async () => undefined,
  };
}
