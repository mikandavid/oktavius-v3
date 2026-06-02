import { useCallback, useEffect, useMemo, useState } from 'react';

import { SavedViewSelector, type SavedView } from '@/components/data/SavedViewSelector';
import { appToast } from '@/lib/toast';

import {
  createLocalSavedViewsStore,
  createSavedViewFromFilters,
  type SavedViewsStore,
  type StoredSavedView,
} from './savedViewsStorage';

export type SavedViewPreset = SavedView & {
  /** Filter values applied when this view is selected — empty string clears a slot. */
  filters?: Record<string, string>;
};

type UseListSavedViewsOptions = {
  views: SavedViewPreset[];
  listKey: string;
  filterKeys: string[];
  values: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
  store?: SavedViewsStore;
};

/** Saved-view dropdown for CrudMainView `toolbarTrailing` — applies filter presets per view. */
export function useListSavedViews({
  views,
  listKey,
  filterKeys,
  values,
  onFilterChange,
  onReset,
  store,
}: UseListSavedViewsOptions) {
  const defaultId = views.find((view) => view.isDefault)?.id ?? views[0]?.id ?? '';
  const storage = typeof window === 'undefined' ? undefined : window.localStorage;
  const localStore = useMemo(
    () => createLocalSavedViewsStore(storage, listKey),
    [storage, listKey],
  );
  const savedViewsStore = store ?? localStore;
  const [customViews, setCustomViews] = useState<StoredSavedView[]>([]);
  const resolvedViews = useMemo(() => [...views, ...customViews], [views, customViews]);
  const [activeViewId, setActiveViewId] = useState(defaultId);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve(savedViewsStore.load()).then((loadedViews) => {
      if (!cancelled) {
        setCustomViews(loadedViews);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [savedViewsStore]);

  const applyView = useCallback(
    (viewId: string) => {
      setActiveViewId(viewId);
      const view = resolvedViews.find((entry) => entry.id === viewId);
      if (!view?.filters) {
        onReset();
        return;
      }
      for (const key of filterKeys) {
        onFilterChange(key, view.filters[key] ?? '');
      }
    },
    [resolvedViews, filterKeys, onFilterChange, onReset],
  );

  const saveCurrentView = useCallback(async () => {
    const label = `Custom view ${customViews.length + 1}`;
    const nextView = createSavedViewFromFilters({ label, filterKeys, values });
    const nextViews = [...customViews, nextView];
    setCustomViews(nextViews);
    await savedViewsStore.save(nextViews);
    setActiveViewId(nextView.id);
    appToast.success('Current filters saved as view.');
  }, [customViews, filterKeys, savedViewsStore, values]);

  const clearCustomViews = useCallback(async () => {
    setCustomViews([]);
    await savedViewsStore.clear();
    setActiveViewId(defaultId);
    appToast.success('Custom saved views cleared.');
  }, [defaultId, savedViewsStore]);

  const toolbarTrailing = (
    <SavedViewSelector
      views={resolvedViews}
      value={activeViewId}
      onChange={applyView}
      onSaveCurrent={() => void saveCurrentView()}
      onManage={customViews.length > 0 ? () => void clearCustomViews() : undefined}
    />
  );

  return { activeViewId, toolbarTrailing, applyView, saveCurrentView, clearCustomViews };
}
