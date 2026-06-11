import { act } from 'react';
import type { ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { StorageFileLinkPickerDialogProps } from './StorageFileLinkPickerDialog';
import { EntityStoragePanel, type EntityStorageFile } from './EntityStoragePanel';
import type { StorageLinkNode } from './StorageFileLinkPickerDialog';

const storageDialogMock = vi.hoisted(() => ({
  requestedIds: null as string[] | null,
  latestLinkedNodeIds: [] as string[],
}));

vi.mock('./StorageFileLinkPickerDialog', () => ({
  StorageFileLinkPickerDialog: (props: StorageFileLinkPickerDialogProps) => {
    storageDialogMock.latestLinkedNodeIds = props.linkedNodeIds;

    return props.open ? (
      <button
        type="button"
        onClick={() =>
          props.onLinked?.(storageDialogMock.requestedIds ?? [props.nodes?.[0]?.id ?? ''])
        }
      >
        Pick file
      </button>
    ) : null;
  },
}));

function renderPanel(props: Partial<ComponentProps<typeof EntityStoragePanel>> = {}) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  const render = (nextProps: Partial<ComponentProps<typeof EntityStoragePanel>> = props) => {
    act(() => {
      root.render(<EntityStoragePanel entityType="client" entityId="client_1" {...nextProps} />);
    });
  };
  render(props);

  return { container, root, render };
}

function buttonByText(container: HTMLElement, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(text),
  );
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Expected ${text} button to render.`);
  }
  return button;
}

const asyncFile: EntityStorageFile = {
  id: 'file_1',
  name: 'Async contract.pdf',
  group: 'documents',
  size: 128_000,
  uploadedAt: '2026-06-10',
};

const storageNode: StorageLinkNode = {
  id: 'node_1',
  name: 'Library document.pdf',
  fileSizeBytes: 42_000,
  mimeType: 'application/pdf',
  uploadStatus: 'ready',
  updatedAt: '2026-06-10',
};

describe('EntityStoragePanel production storage state', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    storageDialogMock.requestedIds = null;
    storageDialogMock.latestLinkedNodeIds = [];
    roots = [];
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
  });

  it('syncs rendered files when async props arrive after mount', () => {
    const rendered = renderPanel({ files: [] });
    roots.push(rendered.root);

    rendered.render({ files: [asyncFile] });

    expect(rendered.container.textContent).toContain('Async contract.pdf');
  });

  it('disables linking when no storage source nodes are available', () => {
    const rendered = renderPanel();
    roots.push(rendered.root);

    expect(buttonByText(rendered.container, 'Link').disabled).toBe(true);
  });

  it('appends visible linked files when storage nodes are available', async () => {
    const rendered = renderPanel({ availableNodes: [storageNode] });
    roots.push(rendered.root);

    act(() => {
      buttonByText(rendered.container, 'Link').dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    await act(async () => {
      buttonByText(document.body, 'Pick file').dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    expect(rendered.container.textContent).toContain('Library document.pdf');
  });

  it('ignores unknown linked ids without marking them linked', async () => {
    const rendered = renderPanel({ availableNodes: [storageNode] });
    roots.push(rendered.root);

    storageDialogMock.requestedIds = ['stale_node'];
    act(() => {
      buttonByText(rendered.container, 'Link').dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    await act(async () => {
      buttonByText(document.body, 'Pick file').dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    expect(rendered.container.textContent).not.toContain('stale_node');
    expect(storageDialogMock.latestLinkedNodeIds).not.toContain('stale_node');
  });
});
