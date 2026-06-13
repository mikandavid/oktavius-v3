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
  it('single-click fires onSelect after timer expires, onOpen is NOT called', async () => {
    const onSelect = vi.fn();
    const onOpen = vi.fn();

    // Render with real timers so React internal scheduling isn't blocked
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

    // Switch to fake timers only for the event dispatch / assertion phase
    vi.useFakeTimers();
    try {
      await act(async () => {
        tile.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      // Timer has not fired yet — neither callback should have been called
      expect(onSelect).not.toHaveBeenCalled();
      expect(onOpen).not.toHaveBeenCalled();

      // Advance past the 220 ms debounce
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith(node);
      expect(onOpen).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('double-click fires onOpen and onSelect is NOT called', async () => {
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

    vi.useFakeTimers();
    try {
      // Simulate real browser sequence: click, click, dblclick
      await act(async () => {
        tile.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        tile.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        tile.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      });

      // Advance timers — the pending single-click timer was cancelled by dblclick handler
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(onOpen).toHaveBeenCalledOnce();
      expect(onOpen).toHaveBeenCalledWith(node);
      expect(onSelect).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
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
