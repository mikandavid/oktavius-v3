import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getWindowStorage } from '@/lib/storage/safeStorage';

import type {
  StorageDisplayMode,
  StorageSearchScope,
  StorageSort,
  StorageView,
} from './data/types';

const DISPLAY_MODE_KEY = 'oktavius.storage.displayMode';
const VIEWS: StorageView[] = ['folder', 'recent', 'starred', 'trash'];

export interface StorageViewState {
  view: StorageView;
  currentFolderId: string | null;
  displayMode: StorageDisplayMode;
  sort: StorageSort;
  search: { term: string; scope: StorageSearchScope };
  previewNodeId: string | null;
  setView: (view: StorageView) => void;
  openFolder: (folderId: string | null) => void;
  setDisplayMode: (mode: StorageDisplayMode) => void;
  setSort: (sort: StorageSort) => void;
  setSearch: (search: { term: string; scope: StorageSearchScope }) => void;
  setPreviewNodeId: (id: string | null) => void;
}

export function useStorageViewState(): StorageViewState {
  const [searchParams, setSearchParams] = useSearchParams();
  const storage = getWindowStorage('localStorage');

  const view = (
    VIEWS.includes(searchParams.get('view') as StorageView) ? searchParams.get('view') : 'folder'
  ) as StorageView;
  const currentFolderId = searchParams.get('folder');

  const [displayMode, setDisplayModeState] = useState<StorageDisplayMode>(
    () => (storage?.getItem(DISPLAY_MODE_KEY) as StorageDisplayMode) || 'grid',
  );
  const [sort, setSort] = useState<StorageSort>({ by: 'name', dir: 'asc' });
  const [search, setSearch] = useState<{ term: string; scope: StorageSearchScope }>({
    term: '',
    scope: 'current',
  });
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);

  const setDisplayMode = useCallback(
    (mode: StorageDisplayMode) => {
      setDisplayModeState(mode);
      storage?.setItem(DISPLAY_MODE_KEY, mode);
    },
    [storage],
  );

  const setView = useCallback(
    (next: StorageView) => {
      setSearchParams((params) => {
        params.set('view', next);
        params.delete('folder');
        return params;
      });
    },
    [setSearchParams],
  );

  const openFolder = useCallback(
    (folderId: string | null) => {
      setSearchParams((params) => {
        params.set('view', 'folder');
        if (folderId) params.set('folder', folderId);
        else params.delete('folder');
        return params;
      });
    },
    [setSearchParams],
  );

  useEffect(() => {
    setSearch((prev) => (prev.term ? { ...prev, term: '' } : prev));
  }, [view, currentFolderId]);

  return {
    view,
    currentFolderId,
    displayMode,
    sort,
    search,
    previewNodeId,
    setView,
    openFolder,
    setDisplayMode,
    setSort,
    setSearch,
    setPreviewNodeId,
  };
}
