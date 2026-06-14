import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import type { StorageNode } from '../data/types';
import { StorageGrid } from './StorageGrid';
import type { StorageItemActions } from './StorageItemMenu';

const node: StorageNode = {
  id: 'f1',
  parentId: null,
  nodeType: 'file',
  name: 'Q3.pdf',
  mimeType: 'application/pdf',
  fileExtension: 'pdf',
  fileSizeBytes: 2048,
  uploadStatus: 'ready',
  trashedAt: null,
  purgeAfterAt: null,
  createdBy: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function makeActions(): StorageItemActions {
  return {
    isStarred: () => false,
    onOpen: vi.fn(),
    onDownload: vi.fn(),
    onRename: vi.fn(),
    onMove: vi.fn(),
    onToggleStar: vi.fn(),
    onTrash: vi.fn(),
    onRestore: vi.fn(),
    onPurge: vi.fn(),
  };
}

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function renderGrid(props: {
  onToggleSelect: (node: StorageNode) => void;
  onOpen: (node: StorageNode) => void;
  selectedIds?: string[];
}) {
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <TestI18nProvider>
          <StorageGrid
            nodes={[node]}
            actions={makeActions()}
            inTrash={false}
            selectedIds={props.selectedIds ?? []}
            onToggleSelect={props.onToggleSelect}
            onOpen={props.onOpen}
          />
        </TestI18nProvider>
      </QueryClientProvider>,
    );
  });
}

describe('StorageGrid', () => {
  it('opens immediately on tile click (no selection)', async () => {
    const onToggleSelect = vi.fn();
    const onOpen = vi.fn();
    await renderGrid({ onToggleSelect, onOpen });

    const tile = container.querySelector('[role="button"]') as HTMLElement;
    expect(tile).not.toBeNull();
    await act(async () => {
      tile.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onOpen).toHaveBeenCalledWith(node);
    expect(onToggleSelect).not.toHaveBeenCalled();
  });

  it('toggles selection via the checkbox without opening', async () => {
    const onToggleSelect = vi.fn();
    const onOpen = vi.fn();
    await renderGrid({ onToggleSelect, onOpen });

    const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement;
    expect(checkbox).not.toBeNull();
    await act(async () => {
      checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onToggleSelect).toHaveBeenCalledWith(node);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('opens on Enter and toggles selection on Space', async () => {
    const onToggleSelect = vi.fn();
    const onOpen = vi.fn();
    await renderGrid({ onToggleSelect, onOpen });

    const tile = container.querySelector('[role="button"]') as HTMLElement;
    await act(async () => {
      tile.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(onOpen).toHaveBeenCalledWith(node);
    await act(async () => {
      tile.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    });
    expect(onToggleSelect).toHaveBeenCalledWith(node);
  });
});
