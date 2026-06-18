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
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;
  documentNodeId: string | null;
  openDocument: (id: string) => void;
  closeDocument: () => void;
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
  const documentNodeId = searchParams.get('doc');

  const [displayMode, setDisplayModeState] = useState<StorageDisplayMode>(
    () => (storage?.getItem(DISPLAY_MODE_KEY) as StorageDisplayMode) || 'list',
  );
  const [sort, setSort] = useState<StorageSort>({ by: 'name', dir: 'asc' });
  const [search, setSearch] = useState<{ term: string; scope: StorageSearchScope }>({
    term: '',
    scope: 'current',
  });
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

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

  const openDocument = useCallback(
    (id: string) => {
      setSearchParams((params) => {
        params.set('doc', id);
        return params;
      });
    },
    [setSearchParams],
  );

  const closeDocument = useCallback(() => {
    setSearchParams((params) => {
      params.delete('doc');
      return params;
    });
  }, [setSearchParams]);

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
    editingNodeId,
    setEditingNodeId,
    documentNodeId,
    openDocument,
    closeDocument,
    setView,
    openFolder,
    setDisplayMode,
    setSort,
    setSearch,
    setPreviewNodeId,
  };
}
