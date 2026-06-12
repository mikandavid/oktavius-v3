import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActiveLocationProvider } from '@/lib/locations/ActiveLocationContext';
import type { OsirisRuntimeState } from '@/runtime/osiris/types';
import { OsirisRuntimeContext } from '@/runtime/osiris/useOsirisRuntime';

import { StandardCrudListPage } from './StandardCrudListPage';
import { buildStandardListCrudActions } from './standardListCrud';
import { buildStandardCrudListRequestParams } from './standardCrudQuery';
import type { SavedViewsRuntimeAdapter } from './savedViewsRuntime';

vi.mock('./CrudMainView', () => ({
  CrudMainView: ({
    rows,
    allRows,
    isLoading,
    onPageChange,
  }: {
    rows: Array<{ name: string }>;
    allRows?: Array<{ name: string }>;
    isLoading?: boolean;
    onPageChange?: (page: number) => void;
  }) => (
    <div data-loading={String(Boolean(isLoading))}>
      <div data-testid="all-rows">{(allRows ?? []).map((row) => row.name).join(',')}</div>
      {rows.map((row) => (
        <span key={row.name}>{row.name}</span>
      ))}
      <button type="button" onClick={() => onPageChange?.(2)}>
        Go to page 2
      </button>
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
  rows = [],
  savedViewsRuntime,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  }),
}: {
  loadRows?: (params: Record<string, string>) => Promise<{
    data: TestRow[];
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
  }>;
  rows?: TestRow[];
  savedViewsRuntime?: SavedViewsRuntimeAdapter;
  queryClient?: QueryClient;
}) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const osirisRuntime: OsirisRuntimeState & {
    isLoading: boolean;
    error: Error | null;
    reload: () => Promise<void>;
  } = {
    sessionStatus: 'authenticated',
    currentUser: {
      id: 'user_1',
      email: 'anna@example.test',
      fullName: 'Anna',
      isSuperadmin: false,
    },
    organizations: [{ id: 'org_1', name: 'Kunz', slug: 'kunz' }],
    memberships: [{ org_id: 'org_1', role: 'admin', is_active: true }],
    activeOrgId: 'org_1',
    activeSiteId: null,
    permissions: ['records.delete'],
    permissionSubject: {
      isSuperadmin: false,
      role: 'admin',
      permissions: ['records.delete'],
    },
    locationAccess: null,
    config: null,
    ...(savedViewsRuntime ? { savedViewsRuntime } : {}),
    isLoading: false,
    error: null,
    reload: async () => undefined,
  };
  const router = createMemoryRouter(
    [
      {
        path: '/clients',
        element: (
          <NuqsAdapter>
            <QueryClientProvider client={queryClient}>
              <OsirisRuntimeContext.Provider value={osirisRuntime}>
                <ActiveLocationProvider>
                  <StandardCrudListPage<TestRow>
                    title="Clients"
                    rows={rows}
                    loadRows={loadRows}
                    columns={[{ key: 'name', header: 'Name' }]}
                    filters={[]}
                    savedViews={[{ id: 'all', label: 'All clients' }]}
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
                </ActiveLocationProvider>
              </OsirisRuntimeContext.Provider>
            </QueryClientProvider>
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

async function waitForText(container: HTMLElement, expected: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });

    const text = container.textContent ?? '';
    if (text.includes(expected)) return text;
  }

  return container.textContent ?? '';
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

    const text = await waitForText(rendered.container, 'Apex Technologies');

    expect(loadRows).toHaveBeenCalledWith({
      page: '1',
      pageSize: '10',
      sort: 'name',
      search: '',
    });
    expect(text).toContain('Apex Technologies');
  });

  it('requests the selected server page without clamping to local rows', async () => {
    const loadRows = vi.fn(async (params: Record<string, string>) => ({
      data: [
        { id: `client_page_${params.page}`, name: `Client page ${params.page}`, status: 'active' },
      ],
      total: 20,
      totalPages: 2,
      page: Number(params.page),
      pageSize: 10,
    }));

    const rendered = renderStandardCrudListPage({ loadRows });
    roots.push(rendered.root);

    await waitForText(rendered.container, 'Client page 1');

    act(() => {
      rendered.container
        .querySelector('button')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitForText(rendered.container, 'Client page 2');

    expect(loadRows).toHaveBeenLastCalledWith({
      page: '2',
      pageSize: '10',
      sort: 'name',
      search: '',
    });
  });

  it('exposes visible server rows for export data in server mode', async () => {
    const loadRows = vi.fn(async () => ({
      data: [{ id: 'client_1', name: 'Apex Technologies', status: 'active' }],
      total: 1,
      totalPages: 1,
      page: 1,
      pageSize: 10,
    }));

    const rendered = renderStandardCrudListPage({ loadRows });
    roots.push(rendered.root);

    await waitForText(rendered.container, 'Apex Technologies');

    expect(rendered.container.querySelector('[data-testid="all-rows"]')?.textContent).toBe(
      'Apex Technologies',
    );
  });

  it('keeps rendering client-side rows when no server loader is provided', async () => {
    const rendered = renderStandardCrudListPage({
      rows: [{ id: 'client_2', name: 'Local Client', status: 'active' }],
    });
    roots.push(rendered.root);

    const text = await waitForText(rendered.container, 'Local Client');

    expect(text).toContain('Local Client');
    expect(rendered.container.querySelector('[data-loading]')?.getAttribute('data-loading')).toBe(
      'false',
    );
  });

  it('loads custom saved views from the Osiris runtime when available', async () => {
    const savedViewsRuntime: SavedViewsRuntimeAdapter = {
      fetchViews: vi.fn(async () => [
        { id: 'custom_1', label: 'Active', filters: { status: 'active' } },
      ]),
      persistView: vi.fn(async () => undefined),
      deleteView: vi.fn(async () => undefined),
      shareView: vi.fn(async () => undefined),
    };

    const rendered = renderStandardCrudListPage({ savedViewsRuntime });
    roots.push(rendered.root);

    await waitForText(rendered.container, 'Go to page 2');

    expect(savedViewsRuntime.fetchViews).toHaveBeenCalledWith({ listKey: 'clients' });
  });

  it('ignores cached server rows after remounting without a server loader', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
    });
    const loadRows = vi.fn(async () => ({
      data: [{ id: 'client_server', name: 'Server Client', status: 'active' }],
      total: 1,
      totalPages: 1,
      page: 1,
      pageSize: 10,
    }));

    const serverRendered = renderStandardCrudListPage({ loadRows, queryClient });
    roots.push(serverRendered.root);
    await waitForText(serverRendered.container, 'Server Client');

    act(() => {
      serverRendered.root.unmount();
    });
    roots = roots.filter((root) => root !== serverRendered.root);
    serverRendered.container.remove();

    const localRendered = renderStandardCrudListPage({
      queryClient,
      rows: [{ id: 'client_local', name: 'Local Client', status: 'active' }],
    });
    roots.push(localRendered.root);

    const text = await waitForText(localRendered.container, 'Local Client');

    expect(text).toContain('Local Client');
    expect(text).not.toContain('Server Client');
  });
});
