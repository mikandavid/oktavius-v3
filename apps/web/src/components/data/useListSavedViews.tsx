import { useCallback, useState } from 'react';

import { SavedViewSelector, type SavedView } from '@/components/data/SavedViewSelector';
import { toast } from '@/lib/toast';

export type SavedViewPreset = SavedView & {
  /** Filter values applied when this view is selected — empty string clears a slot. */
  filters?: Record<string, string>;
};

type UseListSavedViewsOptions = {
  views: SavedViewPreset[];
  filterKeys: string[];
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
};

/** Saved-view dropdown for CrudMainView `toolbarTrailing` — applies filter presets per view. */
export function useListSavedViews({
  views,
  filterKeys,
  onFilterChange,
  onReset,
}: UseListSavedViewsOptions) {
  const defaultId = views.find((view) => view.isDefault)?.id ?? views[0]?.id ?? '';
  const [activeViewId, setActiveViewId] = useState(defaultId);

  const applyView = useCallback(
    (viewId: string) => {
      setActiveViewId(viewId);
      const view = views.find((entry) => entry.id === viewId);
      if (!view?.filters) {
        onReset();
        return;
      }
      for (const key of filterKeys) {
        onFilterChange(key, view.filters[key] ?? '');
      }
    },
    [views, filterKeys, onFilterChange, onReset],
  );

  const toolbarTrailing = (
    <SavedViewSelector
      views={views}
      value={activeViewId}
      onChange={applyView}
      onSaveCurrent={() => toast.info('Current filters saved as view (demo).')}
      onManage={() => toast.info('View manager opens here in production.')}
    />
  );

  return { activeViewId, toolbarTrailing, applyView };
}
