import type * as BaseUi from '@oktavius/base-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import type { StorageNode } from '../data/types';
import { StorageDocumentEditorPage } from './StorageDocumentEditorPage';

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

const rename = vi.fn();

vi.mock('@/components/layout/AppShellLayoutContext', () => ({
  useRegisterFillHeightPage: vi.fn(),
}));

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
  useFileTextContent: () => ({ data: '# Notes', isLoading: false, error: null }),
  useSaveTextFile: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useStorageMutations: () => ({ rename: { mutate: rename } }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  rename.mockClear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderPage(onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => {
    root.render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <TestI18nProvider>
            <StorageDocumentEditorPage nodeId="n1" onClose={onClose} onNodeIdChange={vi.fn()} />
          </TestI18nProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );
  });
}

describe('StorageDocumentEditorPage', () => {
  it('renders the document title and editor surface', () => {
    renderPage();
    expect(container.querySelector('[data-testid="storage-document-editor"]')).not.toBeNull();
    const title = container.querySelector<HTMLInputElement>('input[aria-label]')!;
    expect(title.value).toBe('Notes.md');
  });

  it('calls onClose when the back button is clicked', () => {
    const onClose = vi.fn();
    renderPage(onClose);
    const back = container.querySelector<HTMLButtonElement>('[data-testid="editor-back"]')!;
    act(() => back.click());
    expect(onClose).toHaveBeenCalled();
  });

  it('renames via the mutation when the title is committed', () => {
    renderPage();
    const title = container.querySelector<HTMLInputElement>('input[aria-label]')!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(title, 'Renamed.md');
      title.dispatchEvent(new Event('input', { bubbles: true }));
      title.dispatchEvent(new Event('change', { bubbles: true }));
      title.dispatchEvent(new Event('blur', { bubbles: true }));
    });
    expect(rename).toHaveBeenCalledWith({ id: 'n1', name: 'Renamed.md' }, expect.anything());
  });
});
