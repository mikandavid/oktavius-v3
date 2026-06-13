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

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('StorageGrid', () => {
  it('selects on single click and opens on double click', async () => {
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    await act(async () => {
      root.render(
        <TestI18nProvider>
          <StorageGrid
            nodes={[node]}
            actions={makeActions()}
            inTrash={false}
            selectedId={null}
            onSelect={onSelect}
            onOpen={onOpen}
          />
        </TestI18nProvider>,
      );
    });
    const tile = container.querySelector('[role="button"]') as HTMLElement;
    expect(tile).not.toBeNull();
    await act(async () => {
      tile.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onSelect).toHaveBeenCalledWith(node);
    await act(async () => {
      tile.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    });
    expect(onOpen).toHaveBeenCalledWith(node);
  });

  it('opens on Enter key and selects on Space key', async () => {
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    await act(async () => {
      root.render(
        <TestI18nProvider>
          <StorageGrid
            nodes={[node]}
            actions={makeActions()}
            inTrash={false}
            selectedId={null}
            onSelect={onSelect}
            onOpen={onOpen}
          />
        </TestI18nProvider>,
      );
    });
    const tile = container.querySelector('[role="button"]') as HTMLElement;
    expect(tile).not.toBeNull();
    await act(async () => {
      tile.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(onOpen).toHaveBeenCalledWith(node);
    await act(async () => {
      tile.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    });
    expect(onSelect).toHaveBeenCalledWith(node);
  });
});
