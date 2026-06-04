import { StrictMode, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StandardCrudListPage, buildStandardCrudListRequestParams } from './StandardCrudListPage';
import { buildStandardListCrudActions } from './standardListCrud';

const demoData = vi.hoisted(() => ({
  currentUser: { isSuperadmin: false },
  activeMembership: { role: 'admin', permissions: ['records.delete'] },
}));

vi.mock('@/app/demo-data', () => ({
  useDemoData: () => demoData,
}));

vi.mock('./CrudMainView', () => ({
  CrudMainView: ({ rows, isLoading }: { rows: Array<{ name: string }>; isLoading?: boolean }) => (
    <div data-loading={String(Boolean(isLoading))}>
      {rows.map((row) => (
        <span key={row.name}>{row.name}</span>
      ))}
    </div>
  ),
}));

describe('buildStandardListCrudActions', () => {
  it('awaits async deletes before running after-delete cleanup', async () => {
    const calls: string[] = [];
    const actions = buildStandardListCrudActions<{ id: string }>({
      entityLabel: 'record',
      getDetailHref: (row) => `/records/${row.id}`,
      navigate: vi.fn(),
      onDelete: async () => {
        calls.push('delete:start');
        await Promise.resolve();
        calls.push('delete:end');
      },
      onAfterDelete: () => {
        calls.push('after');
      },
    });

    await actions.rowActions.find((action) => action.key === 'delete')?.onClick({ id: 'rec_1' });

    expect(calls).toEqual(['delete:start', 'delete:end', 'after']);
  });

  it('omits destructive row and bulk actions when delete is not allowed', () => {
    const actions = buildStandardListCrudActions<{ id: string }>({
      entityLabel: 'record',
      getDetailHref: (row) => `/records/${row.id}`,
      navigate: vi.fn(),
      onDelete: vi.fn(),
      allowDelete: false,
    });

    expect(actions.rowActions.map((action) => action.key)).toEqual(['edit']);
    expect(actions.bulkActions.map((action) => action.key)).toEqual(['bulk-edit']);
  });
});

describe('buildStandardCrudListRequestParams', () => {
  it('serializes list state for server-backed list contracts', () => {
    expect(
      buildStandardCrudListRequestParams({
        page: 2,
        pageSize: 10,
        sort: '-name',
        search: 'kunz',
        values: { status: 'active', type: '' },
      }),
    ).toEqual({
      page: '2',
      pageSize: '10',
      sort: '-name',
      search: 'kunz',
      status: 'active',
      type: '',
    });
  });
});

type TestRow = {
  id: string;
  name: string;
  status: string;
};

function renderStandardCrudListPage({
  loadRows,
}: {
  loadRows: () => Promise<{
    data: TestRow[];
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
  }>;
}) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const router = createMemoryRouter(
    [
      {
        path: '/clients',
        element: (
          <NuqsAdapter>
            <StandardCrudListPage<TestRow>
              title="Clients"
              rows={[]}
              loadRows={loadRows}
              columns={[{ key: 'name', header: 'Name' }]}
              filters={[]}
              defaultSort="name"
              filterKeys={[]}
              searchKeys={['name']}
              searchPlaceholder="Search clients"
              entityLabel="client"
              getRowHref={(row) => `/clients/${row.id}`}
              exportFileName="clients"
              emptyTitle="No clients found"
              emptyDescription="Create a client or adjust your filters."
            />
          </NuqsAdapter>
        ),
      },
    ],
    {
      initialEntries: ['/clients'],
    },
  );

  act(() => {
    root.render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );
  });

  return { container, root };
}

describe('StandardCrudListPage', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
  });

  it('renders the first server-backed page after the initial load resolves', async () => {
    const loadRows = vi.fn(async () => ({
      data: [{ id: 'client_1', name: 'Apex Technologies', status: 'active' }],
      total: 1,
      totalPages: 1,
      page: 1,
      pageSize: 10,
    }));

    const rendered = renderStandardCrudListPage({ loadRows });
    roots.push(rendered.root);

    await act(async () => {
      await Promise.resolve();
    });

    expect(loadRows).toHaveBeenCalledWith({
      page: '1',
      pageSize: '10',
      sort: 'name',
      search: '',
    });
    expect(rendered.container.textContent).toContain('Apex Technologies');
  });
});
