import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiProvider, type ApiRegistry } from '@/api/ApiProvider';
import type { ListResponse } from '@/api/demo-client';
import type { InvoiceRecord, OrderRecord } from '@/app/demo-data';
import { AppShellLayoutProvider } from '@/components/layout/AppShellLayoutContext';

import { ReportsPage } from './ReportsPage';

const chartCards = vi.hoisted(() => ({
  props: [] as Array<{ title: string; data?: unknown }>,
}));

vi.mock('@oktavius/base-ui', async () => {
  const actual = await vi.importActual<typeof import('@oktavius/base-ui')>('@oktavius/base-ui');
  return {
    ...actual,
    ChartCard: (props: { title: string; data?: unknown }) => {
      chartCards.props.push(props);
      return <section>{props.title}</section>;
    },
  };
});

vi.mock('@/components/reports/ReportBuilderPanel', () => ({
  COMBO_DATA: [],
  MULTI_LINE_REVENUE: [],
  ORDER_STATUS_DATA: [],
  PIPELINE_FUNNEL: [],
  RADAR_KPIS: [],
  RADAR_SERIES: [],
  REVENUE_DATA: [],
  REVENUE_SERIES: [],
  STACKED_PIPELINE: [],
  TOP_CLIENTS: [],
  ReportBuilderPanel: () => <section>Report builder</section>,
}));

function listResponse<T>(data: T[]): ListResponse<T> {
  return {
    data,
    total: data.length,
    totalPages: 1,
    page: 1,
    pageSize: data.length,
  };
}

function renderReportsPage(registry: ApiRegistry) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <MemoryRouter>
        <AppShellLayoutProvider>
          <ApiProvider registry={registry}>
            <ReportsPage />
          </ApiProvider>
        </AppShellLayoutProvider>
      </MemoryRouter>,
    );
  });

  return { container, root };
}

async function waitForText(container: HTMLElement, expected: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const text = container.textContent?.replace(/\s/g, ' ') ?? '';
    if (text.includes(expected)) return text;

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }

  return container.textContent?.replace(/\s/g, ' ') ?? '';
}

describe('ReportsPage', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    chartCards.props = [];
    roots = [];
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
  });

  it('loads report summary data through the API registry', async () => {
    const ordersList = vi.fn(async () =>
      listResponse<OrderRecord>([
        {
          id: 'ord_1',
          orgId: 'org_1',
          orderNumber: 'ORD-1',
          clientId: 'client_1',
          clientName: 'Apex',
          total: '4500',
          orderDate: '2026-01-15',
          dueDate: '2026-02-15',
          status: 'Confirmed',
          owner: 'Anna',
          lineCount: 2,
        },
      ]),
    );
    const invoicesList = vi.fn(async () =>
      listResponse<InvoiceRecord>([
        {
          id: 'inv_1',
          orgId: 'org_1',
          invoiceNumber: 'INV-1',
          clientName: 'Apex',
          orderNumber: 'ORD-1',
          amount: '2500',
          issuedAt: '2026-01-20',
          dueAt: '2026-02-20',
          status: 'Paid',
        },
      ]),
    );
    const registry = {
      orders: { list: ordersList },
      invoices: { list: invoicesList },
    } as unknown as ApiRegistry;

    const rendered = renderReportsPage(registry);
    roots.push(rendered.root);

    expect(ordersList).toHaveBeenCalledWith({ pageSize: '250', sort: '-orderDate' });
    expect(invoicesList).toHaveBeenCalledWith({ pageSize: '250', sort: '-issuedAt' });
    const text = await waitForText(rendered.container, '€2 500 invoiced');
    expect(text).toContain('€2 500 invoiced');
    expect(text).toContain('€4 500 ordered');
    const ordersByStatus = chartCards.props
      .filter((props) => props.title === 'Orders by status')
      .at(-1);
    expect(ordersByStatus?.data).toEqual([{ label: 'Confirmed', value: 1 }]);
    const revenueTrend = chartCards.props.filter((props) => props.title === 'Revenue trend').at(-1);
    expect(revenueTrend?.data).toEqual([{ label: '2026-01', value: 2500 }]);
  });
});
