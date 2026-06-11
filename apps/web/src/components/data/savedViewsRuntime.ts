import {
  createLocalSavedViewsStore,
  type MaybePromise,
  type SavedViewsStore,
  type StoredSavedView,
} from './savedViewsStorage';

export type SavedViewsScope = {
  listKey: string;
};

export type SavedViewsRuntimeAdapter = {
  fetchViews: (scope: SavedViewsScope) => MaybePromise<StoredSavedView[]>;
  persistView: (
    scope: SavedViewsScope,
    view: StoredSavedView,
    views: StoredSavedView[],
  ) => MaybePromise<void>;
  deleteView: (scope: SavedViewsScope, id: string, views: StoredSavedView[]) => MaybePromise<void>;
  shareView: (scope: SavedViewsScope, id: string) => MaybePromise<void>;
};

export function createLocalSavedViewsRuntime(
  storage: Storage | undefined,
): SavedViewsRuntimeAdapter {
  return {
    fetchViews: (scope) => createLocalSavedViewsStore(storage, scope.listKey).load(),
    persistView: (scope, _view, views) =>
      createLocalSavedViewsStore(storage, scope.listKey).save(views),
    deleteView: (scope, _id, views) =>
      createLocalSavedViewsStore(storage, scope.listKey).save(views),
    shareView: () => undefined,
  };
}

export function createSavedViewsStoreFromRuntime(
  runtime: SavedViewsRuntimeAdapter,
  scope: SavedViewsScope,
): SavedViewsStore {
  let loadedViews: StoredSavedView[] = [];

  return {
    load: async () => {
      loadedViews = await runtime.fetchViews(scope);
      return loadedViews;
    },
    save: async (views) => {
      loadedViews = views;
      await Promise.all(views.map((view) => runtime.persistView(scope, view, views)));
    },
    clear: async () => {
      const currentViews = loadedViews;
      loadedViews = [];
      await Promise.all(currentViews.map((view) => runtime.deleteView(scope, view.id, [])));
    },
  };
}
