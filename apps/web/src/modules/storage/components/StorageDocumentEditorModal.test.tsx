import type * as BaseUi from '@oktavius/base-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import type { StorageNode } from '../data/types';
import { StorageDocumentEditorModal } from './StorageDocumentEditorModal';

const node: StorageNode = {
  id: 'n1',
  parentId: 'p1',
  nodeType: 'file',
  name: 'Notes.md',
  mimeType: 'text/markdown',
  fileExtension: 'md',
  fileSizeBytes: 5,
  uploadStatus: 'ready',
  trashedAt: null,
  purgeAfterAt: null,
  createdBy: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const save = vi.fn().mockResolvedValue({ ...node, id: 'n2' });

let textData: string | undefined = '# Notes';

vi.mock('@oktavius/base-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof BaseUi>();
  return {
    ...actual,
    MarkdownEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
      <textarea data-testid="md" value={value} onChange={(e) => onChange(e.target.value)} />
    ),
  };
});

vi.mock('../data/useStorageData', () => ({
  useStorageNode: () => ({ data: node, isLoading: false, error: null }),
  useFileTextContent: () => ({ data: textData, isLoading: false, error: null }),
  useSaveTextFile: () => ({ mutateAsync: save, isPending: false }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  save.mockClear();
  textData = '# Notes';
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

function renderModal(onNodeIdChange = vi.fn(), onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => {
    root.render(
      <QueryClientProvider client={client}>
        <TestI18nProvider>
          <StorageDocumentEditorModal
            nodeId="n1"
            onClose={onClose}
            onNodeIdChange={onNodeIdChange}
          />
        </TestI18nProvider>
      </QueryClientProvider>,
    );
  });
}

describe('StorageDocumentEditorModal', () => {
  it('autosaves after editing and remaps to the new node id', async () => {
    const onNodeIdChange = vi.fn();
    renderModal(onNodeIdChange);

    const textarea = document.querySelector<HTMLTextAreaElement>('[data-testid="md"]')!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
      setter.call(textarea, '# Notes edited');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]![0].markdown).toBe('# Notes edited');
    expect(onNodeIdChange).toHaveBeenCalledWith('n2');
  });

  it('flushes a pending save when closed before the debounce elapses', async () => {
    const onClose = vi.fn();
    renderModal(vi.fn(), onClose);

    const textarea = document.querySelector<HTMLTextAreaElement>('[data-testid="md"]')!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
      setter.call(textarea, '# closing edit');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Close BEFORE advancing past the 1500ms debounce.
    const closeBtn = document.querySelector<HTMLButtonElement>('[data-testid="editor-close"]')!;
    await act(async () => {
      closeBtn.click();
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]![0].markdown).toBe('# closing edit');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not save when the document was not edited', async () => {
    renderModal();
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('does not overwrite in-progress edits when server content refetches', async () => {
    renderModal();
    const textarea = document.querySelector<HTMLTextAreaElement>('[data-testid="md"]')!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
      setter.call(textarea, '# my local edit');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    // Simulate a refetch returning different server content while still dirty
    // (do NOT advance timers, so no save/flush has run yet — doc is dirty).
    textData = '# different server text';
    renderModal(); // re-render; the load effect must NOT adopt the new server text
    const after = document.querySelector<HTMLTextAreaElement>('[data-testid="md"]')!;
    expect(after.value).toBe('# my local edit');
  });
});
