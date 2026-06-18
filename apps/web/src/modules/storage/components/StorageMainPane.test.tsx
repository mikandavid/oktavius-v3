import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { storageKeys } from '../data/storageKeys';
import type { NodeListResult } from '../data/types';
import type { StorageViewState } from '../useStorageViewState';
import { StorageMainPane } from './StorageMainPane';

const EMPTY_LIST: NodeListResult = {
  data: [],
  total: 0,
  page: 1,
  pageSize: 0,
  totalPages: 1,
  hasMore: false,
};

function makeState(overrides: Partial<StorageViewState> = {}): StorageViewState {
  return {
    view: 'folder',
    currentFolderId: null,
    displayMode: 'grid',
    sort: { by: 'name', dir: 'asc' },
    search: { term: '', scope: 'current' },
    previewNodeId: null,
    editingNodeId: null,
    setEditingNodeId: vi.fn(),
    documentNodeId: null,
    openDocument: vi.fn(),
    closeDocument: vi.fn(),
    setView: vi.fn(),
    openFolder: vi.fn(),
    setDisplayMode: vi.fn(),
    setSort: vi.fn(),
    setSearch: vi.fn(),
    setPreviewNodeId: vi.fn(),
    ...overrides,
  };
}

// Pre-seed every query the pane reads so it renders the resolved empty state
// synchronously instead of a loading skeleton.
function seed(queryClient: QueryClient, state: StorageViewState) {
  queryClient.setQueryData(storageKeys.tree(null), []);
  queryClient.setQueryData(storageKeys.favorites(null), []);
  queryClient.setQueryData(storageKeys.trash(null, 1), EMPTY_LIST);
  queryClient.setQueryData(
    storageKeys.nodes(null, {
      folderId: state.currentFolderId,
      sortBy: state.sort.by,
      sortDir: state.sort.dir,
      search: state.search.term || undefined,
      scope: state.search.scope,
    }),
    EMPTY_LIST,
  );
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

async function renderPane(state: StorageViewState) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  seed(queryClient, state);
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <TestI18nProvider>
          <StorageMainPane state={state} />
        </TestI18nProvider>
      </QueryClientProvider>,
    );
  });
}

describe('StorageMainPane create affordances', () => {
  it('offers create CTAs in the empty folder view and opens the new-folder dialog', async () => {
    await renderPane(makeState());

    const emptyState = container.querySelector('.border-dashed');
    expect(emptyState).not.toBeNull();
    const ctas = emptyState?.querySelectorAll('button') ?? [];
    expect(ctas).toHaveLength(2);

    await act(async () => {
      (ctas[0] as HTMLButtonElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // The new-folder NameDialog (a radix Dialog) portals into the document.
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('omits create CTAs outside the folder view', async () => {
    await renderPane(makeState({ view: 'trash' }));

    const emptyState = container.querySelector('.border-dashed');
    expect(emptyState).not.toBeNull();
    expect(emptyState?.querySelectorAll('button') ?? []).toHaveLength(0);
  });

  it('omits create CTAs while searching', async () => {
    await renderPane(makeState({ search: { term: 'invoice', scope: 'current' } }));

    const emptyState = container.querySelector('.border-dashed');
    expect(emptyState).not.toBeNull();
    expect(emptyState?.querySelectorAll('button') ?? []).toHaveLength(0);
  });
});
