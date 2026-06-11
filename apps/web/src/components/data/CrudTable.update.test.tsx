import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CrudTable, type CrudColumn } from './CrudTable';

vi.mock('@1771technologies/lytenyte-core', () => ({
  Grid: ({ rowSource }: { rowSource: { __rows: Row[] } }) => (
    <div>
      {rowSource.__rows.map((row) => (
        <span key={row.id}>{row.name}</span>
      ))}
    </div>
  ),
  useClientDataSource: ({ data }: { data: Row[] }) => ({ __rows: data }),
}));

vi.mock('@/app/demo-data', () => {
  const demoData = {
    currentUser: { isSuperadmin: false },
    activeMembership: { role: 'member', permissions: [] },
  };
  return {
    useDemoData: () => demoData,
    useOptionalDemoData: () => demoData,
  };
});

type Row = {
  id: string;
  name: string;
};

const columns: CrudColumn<Row>[] = [{ key: 'name', header: 'Name' }];

function renderTable({ rows, isLoading = false }: { rows: Row[]; isLoading?: boolean }) {
  return (
    <CrudTable<Row> data={rows} columns={columns} isLoading={isLoading} emptyTitle="No rows" />
  );
}

describe('CrudTable data updates', () => {
  let root: Root | null = null;
  let container: HTMLElement;
  let originalResizeObserver: typeof ResizeObserver | undefined;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: 960 });
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    document.body.innerHTML = '';
    globalThis.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
    root = null;
  });

  it('renders rows after mounting in an empty loading state', async () => {
    act(() => {
      root?.render(renderTable({ rows: [], isLoading: true }));
    });

    act(() => {
      root?.render(renderTable({ rows: [{ id: 'row_1', name: 'Apex Technologies' }] }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Apex Technologies');
  });
});
