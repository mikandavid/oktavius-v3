import { useMemo } from 'react';

import {
  ChartCard,
  STAT_CARD_GRID_CLASS,
  SectionCard,
  SimpleBarChart,
  StatCard,
  Timeline,
  type ChartPoint,
} from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { useDemoData } from '@/app/demo-data';
import { CaseIcon, InvoiceIcon, OrderIcon, ProjectsIcon } from '@/lib/icons';
import { dashboardPageIcon } from '@/lib/modulePageIcons';

function aggregateOrdersByMonth(orders: Array<{ orderDate: string; total: string }>): ChartPoint[] {
  const buckets = new Map<string, number>();

  for (const order of orders) {
    const month = order.orderDate.slice(0, 7);
    buckets.set(month, (buckets.get(month) ?? 0) + Number.parseFloat(order.total));
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({
      label,
      value: Math.round(value),
    }));
}

export function DashboardPage() {
  const { clients, orders, cases, invoices } = useDemoData();

  const overdueInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === 'Overdue').length,
    [invoices],
  );

  const openCases = useMemo(
    () => cases.filter((entry) => entry.stage !== 'Closed').length,
    [cases],
  );

  const orderVolume = useMemo(() => aggregateOrdersByMonth(orders), [orders]);

  const activityEvents = useMemo(
    () => [
      {
        id: 'evt_1',
        label: 'Invoice marked overdue',
        description: 'INV-2024-9012 · Donau Logistics AG',
        timestamp: '2024-12-01T09:15:00Z',
        tone: 'warning' as const,
      },
      {
        id: 'evt_2',
        label: 'Order confirmed',
        description: 'SO-2024-1042 · Apex Technologies GmbH',
        timestamp: '2024-11-02T14:20:00Z',
        tone: 'success' as const,
      },
      {
        id: 'evt_3',
        label: 'Case escalated',
        description: 'CASE-2024-0892 · Billing dispute',
        timestamp: '2024-11-28T11:05:00Z',
        tone: 'info' as const,
      },
      {
        id: 'evt_4',
        label: 'New client added',
        description: 'Clara Sonnenschein · prospect',
        timestamp: '2024-05-03T08:00:00Z',
        tone: 'default' as const,
      },
    ],
    [],
  );

  return (
    <ModulePage
      title="Dashboard"
      subtitle="Workspace overview and recent activity"
      icon={dashboardPageIcon()}
    >
      <div className={STAT_CARD_GRID_CLASS}>
        <StatCard
          label="Clients"
          value={String(clients.length)}
          icon={<ProjectsIcon size={18} weight="duotone" />}
          description="Active accounts"
        />
        <StatCard
          label="Orders"
          value={String(orders.length)}
          icon={<OrderIcon size={18} weight="duotone" />}
          description="All statuses"
        />
        <StatCard
          label="Open cases"
          value={String(openCases)}
          icon={<CaseIcon size={18} weight="duotone" />}
          delta={`${cases.length} total`}
          trend="neutral"
        />
        <StatCard
          label="Invoices overdue"
          value={String(overdueInvoices)}
          icon={<InvoiceIcon size={18} weight="duotone" />}
          trend={overdueInvoices > 0 ? 'down' : 'neutral'}
          delta={overdueInvoices > 0 ? 'Needs attention' : 'All clear'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Order volume"
          meta="Monthly totals from demo orders"
          type="bar"
          data={orderVolume}
          valueFormatter={(value) => `€${value.toLocaleString('de-AT')}`}
        />

        <SectionCard title="Pipeline snapshot" meta="Orders by month">
          <SimpleBarChart
            data={orderVolume}
            height={220}
            valueFormatter={(value) => `€${value.toLocaleString('de-AT')}`}
            className="border-0 bg-transparent p-0"
          />
        </SectionCard>
      </div>

      <SectionCard title="Recent activity" meta="Sample workspace events">
        <Timeline events={activityEvents} />
      </SectionCard>
    </ModulePage>
  );
}
