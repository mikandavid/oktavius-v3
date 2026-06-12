import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CrudTable, type BulkAction, type CrudColumn, type CrudRowAction } from './CrudTable';

type Row = {
  id: string;
  name: string;
  margin: string;
};

vi.mock('@1771technologies/lytenyte-core', () => ({
  Grid: ({ columns, rowSource }: { columns: GridColumn[]; rowSource: { __rows: Row[] } }) => (
    <div>
      <div>
        {columns.map((column) => (
          <span key={column.id} data-column-id={column.id}>
            {column.name || column.id}
          </span>
        ))}
      </div>
      {rowSource.__rows.map((row) => (
        <div key={row.id}>
          {columns.map((column) => (
            <div key={`${row.id}-${column.id}`}>
              {column.cellRenderer?.({ row: { kind: 'leaf', data: row } })}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  useClientDataSource: ({ data }: { data: Row[] }) => ({ __rows: data }),
}));

type GridColumn = {
  id: string;
  name?: string;
  cellRenderer?: (args: { row: { kind: 'leaf'; data: Row } }) => React.ReactNode;
};

const rows: Row[] = [{ id: 'row_1', name: 'Apex Technologies', margin: '42%' }];

function renderTable({
  columns,
  rowActions = [],
  bulkActions = [],
  selectedIds = [],
}: {
  columns: CrudColumn<Row>[];
  rowActions?: CrudRowAction<Row>[];
  bulkActions?: BulkAction[];
  selectedIds?: string[];
}) {
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', { configurable: true, value: 960 });
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <CrudTable<Row>
        data={rows}
        columns={columns}
        rowActions={rowActions}
        bulkActions={bulkActions}
        selectedIds={selectedIds}
        selectable
        emptyTitle="No rows"
      />,
    );
  });

  return { container, root };
}

describe('CrudTable permissions', () => {
  let roots: Root[] = [];
  let originalResizeObserver: typeof ResizeObserver | undefined;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
    globalThis.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
  });

  it('hides permissioned columns, row actions, and bulk actions when permission is missing', () => {
    const rendered = renderTable({
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'margin', header: 'Margin', permission: 'demo.locked' },
      ],
      rowActions: [
        { key: 'approve', label: 'Approve', permission: 'demo.locked', onClick: vi.fn() },
      ],
      bulkActions: [
        { key: 'export', label: 'Export', permission: 'demo.locked', onClick: vi.fn() },
      ],
      selectedIds: ['row_1'],
    });
    roots.push(rendered.root);

    expect(rendered.container.textContent).toContain('Name');
    expect(rendered.container.textContent).not.toContain('Margin');
    expect(rendered.container.querySelector('[data-column-id="__actions__"]')).toBeNull();
    expect(rendered.container.textContent).not.toContain('Export');
  });
});
