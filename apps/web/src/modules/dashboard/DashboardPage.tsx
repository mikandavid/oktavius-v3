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
import { useOrgProfile } from '@/lib/org-profiles/useOrgProfile';

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

function aggregateCasesByStage(
  cases: Array<{ stage: string }>,
  stageOrder: readonly string[],
): ChartPoint[] {
  const buckets = new Map<string, number>();

  for (const entry of cases) {
    buckets.set(entry.stage, (buckets.get(entry.stage) ?? 0) + 1);
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => {
      const leftIndex = stageOrder.indexOf(left);
      const rightIndex = stageOrder.indexOf(right);
      if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    })
    .map(([label, value]) => ({ label, value }));
}

const FUNERAL_CASE_STAGES = ['Aufnahme', 'Planung', 'Durchführung', 'Abgeschlossen'] as const;
const GENERIC_CASE_STAGES = ['Intake', 'Investigation', 'Resolution', 'Closed'] as const;

export function DashboardPage() {
  const { clients, orders, cases, invoices, products } = useDemoData();
  const profile = useOrgProfile();
  const isFuneral = profile.industryKey === 'funeral';

  const overdueInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === 'Overdue').length,
    [invoices],
  );

  const closedStage = isFuneral ? 'Abgeschlossen' : 'Closed';

  const openCases = useMemo(
    () => cases.filter((entry) => entry.stage !== closedStage).length,
    [cases, closedStage],
  );

  const orderVolume = useMemo(() => aggregateOrdersByMonth(orders), [orders]);

  const casesByStage = useMemo(
    () => aggregateCasesByStage(cases, isFuneral ? FUNERAL_CASE_STAGES : GENERIC_CASE_STAGES),
    [cases, isFuneral],
  );

  const activityEvents = useMemo(
    () =>
      isFuneral
        ? [
            {
              id: 'evt_k1',
              label: 'Bestattungsauftrag digitalisiert',
              description: 'KUNZ-2026-0042 · Wallner Friedrich',
              timestamp: '2026-05-13T10:30:00Z',
              tone: 'success' as const,
            },
            {
              id: 'evt_k2',
              label: 'Trauerfeier terminiert',
              description: 'KUNZ-2026-0042 · Pfarrkirche Pitten',
              timestamp: '2026-05-14T08:00:00Z',
              tone: 'info' as const,
            },
            {
              id: 'evt_k3',
              label: 'Sterbefall in Planung',
              description: 'KUNZ-2026-0038 · Huber Maria',
              timestamp: '2026-05-08T14:20:00Z',
              tone: 'default' as const,
            },
            {
              id: 'evt_k4',
              label: 'Vorsorge aktualisiert',
              description: 'Hermine Wallner',
              timestamp: '2026-04-18T09:15:00Z',
              tone: 'default' as const,
            },
          ]
        : [
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
    [isFuneral],
  );

  const currencyFormatter = (value: number) => `€${value.toLocaleString('de-AT')}`;

  return (
    <ModulePage
      title={profile.terminology.dashboard}
      subtitle={
        isFuneral
          ? `${profile.tagline} — Filialen Pitten bis Puchberg`
          : 'Workspace overview and recent activity'
      }
      icon={dashboardPageIcon()}
    >
      <div className={STAT_CARD_GRID_CLASS}>
        <StatCard
          label={profile.terminology.clients}
          value={String(clients.length)}
          icon={<ProjectsIcon size={18} weight="duotone" />}
          description={isFuneral ? 'Kontakte & Lieferanten' : 'Active accounts'}
        />
        <StatCard
          label={profile.terminology.orders}
          value={String(orders.length)}
          icon={<OrderIcon size={18} weight="duotone" />}
          description={isFuneral ? 'Verkaufsbelege' : 'All statuses'}
        />
        <StatCard
          label={isFuneral ? `Offene ${profile.terminology.cases}` : 'Open cases'}
          value={String(openCases)}
          icon={<CaseIcon size={18} weight="duotone" />}
          delta={isFuneral ? `${cases.length} gesamt` : `${cases.length} total`}
          trend="neutral"
        />
        <StatCard
          label={isFuneral ? `${profile.terminology.products}-Artikel` : 'Invoices overdue'}
          value={isFuneral ? String(products.length) : String(overdueInvoices)}
          icon={<InvoiceIcon size={18} weight="duotone" />}
          trend={!isFuneral && overdueInvoices > 0 ? 'down' : 'neutral'}
          delta={
            isFuneral
              ? 'Leistungen & Produkte'
              : overdueInvoices > 0
                ? 'Needs attention'
                : 'All clear'
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={isFuneral ? 'Umsatz Verkauf' : 'Order volume'}
          meta={isFuneral ? 'Monatliche Summen (Demo)' : 'Monthly totals from demo orders'}
          type="bar"
          data={orderVolume}
          valueFormatter={currencyFormatter}
        />

        <SectionCard
          title={isFuneral ? `${profile.terminology.cases} nach Status` : 'Cases by stage'}
          meta={isFuneral ? 'Aufnahme · Planung · Durchführung' : 'Open pipeline by stage'}
        >
          <SimpleBarChart
            data={casesByStage}
            height={220}
            valueFormatter={(value) => String(value)}
            className="border-0 bg-transparent p-0"
          />
        </SectionCard>
      </div>

      <SectionCard
        title={isFuneral ? 'Letzte Vorgänge' : 'Recent activity'}
        meta={isFuneral ? 'Demo-Ereignisse' : 'Sample workspace events'}
      >
        <Timeline events={activityEvents} />
      </SectionCard>
    </ModulePage>
  );
}
