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
import { useUserPreferences } from '@/lib/userPreferences';

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
  locale: 'de' | 'en' | 'fr',
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
    .map(([label, value]) => ({
      label: localizeDashboardCaseStage(label, locale),
      value,
    }));
}

const FUNERAL_CASE_STAGES = ['Aufnahme', 'Planung', 'Durchführung', 'Abgeschlossen'] as const;
const GENERIC_CASE_STAGES = ['Intake', 'Investigation', 'Resolution', 'Closed'] as const;

const CASE_STAGE_LABEL_MAP_BY_LOCALE = {
  de: {
    Intake: 'Intake',
    Investigation: 'Investigation',
    Resolution: 'Resolution',
    Closed: 'Closed',
    Aufnahme: 'Aufnahme',
    Planung: 'Planung',
    Durchführung: 'Durchführung',
    Abgeschlossen: 'Abgeschlossen',
  },
  en: {
    Intake: 'Intake',
    Investigation: 'Investigation',
    Resolution: 'Resolution',
    Closed: 'Closed',
    Aufnahme: 'Intake',
    Planung: 'Planning',
    Durchführung: 'Execution',
    Abgeschlossen: 'Closed',
  },
  fr: {
    Intake: 'Enregistrement',
    Investigation: 'Enquête',
    Resolution: 'Résolution',
    Closed: 'Fermé',
    Aufnahme: 'Admissibilité',
    Planung: 'Planification',
    Durchführung: 'Exécution',
    Abgeschlossen: 'Terminé',
  },
};

function localizeDashboardCaseStage(stage: string, locale: 'de' | 'en' | 'fr') {
  const map = CASE_STAGE_LABEL_MAP_BY_LOCALE[locale];
  return map[stage as keyof typeof map] ?? stage;
}

const DASHBOARD_TEXT: Record<
  'de' | 'en' | 'fr',
  {
    subtitle: string;
    clientsDescription: string;
    ordersDescription: string;
    openCasesLabelPrefix: string;
    openCasesSuffix: string;
    productsDeltaLabel: string;
    orderChartTitlePrefix: string;
    orderChartMeta: string;
    casesByStageLabel: string;
    casesByStageMeta: string;
    recentTitle: string;
    recentMeta: string;
  }
> = {
  de: {
    subtitle: 'Unternehmensübersicht',
    clientsDescription: 'Kontakte & Lieferanten',
    ordersDescription: 'Verkaufsbelege',
    openCasesLabelPrefix: 'Offene',
    openCasesSuffix: 'gesamt',
    productsDeltaLabel: 'Leistungen & Produkte',
    orderChartTitlePrefix: 'Umsatz',
    orderChartMeta: 'Monatliche Summen (Demo)',
    casesByStageLabel: 'nach Status',
    casesByStageMeta: 'Aufnahme · Planung · Durchführung',
    recentTitle: 'Letzte Vorgänge',
    recentMeta: 'Demo-Ereignisse',
  },
  en: {
    subtitle: 'Overview',
    clientsDescription: 'Active accounts',
    ordersDescription: 'Sales records',
    openCasesLabelPrefix: 'Open',
    openCasesSuffix: 'total',
    productsDeltaLabel: 'Services and products',
    orderChartTitlePrefix: 'Sales',
    orderChartMeta: 'Monthly totals from demo orders',
    casesByStageLabel: 'by status',
    casesByStageMeta: 'Open pipeline by stage',
    recentTitle: 'Recent activity',
    recentMeta: 'Sample workspace events',
  },
  fr: {
    subtitle: 'Overview',
    clientsDescription: 'Comptes actifs',
    ordersDescription: 'Enregistrements de ventes',
    openCasesLabelPrefix: 'Ouvert',
    openCasesSuffix: 'total',
    productsDeltaLabel: 'Services et produits',
    orderChartTitlePrefix: 'Ventes',
    orderChartMeta: 'Totaux mensuels des commandes de démonstration',
    casesByStageLabel: 'par statut',
    casesByStageMeta: 'Pipeline ouvert par étape',
    recentTitle: 'Activité récente',
    recentMeta: 'Événements d’échantillon',
  },
};

export function DashboardPage() {
  const { clients, orders, cases, invoices, products } = useDemoData();
  const profile = useOrgProfile();
  const isFuneral = profile.industryKey === 'funeral';
  const { locale } = useUserPreferences();
  const isGerman = locale === 'de';
  const i18n = DASHBOARD_TEXT[locale];
  const stageOrder = isFuneral ? FUNERAL_CASE_STAGES : GENERIC_CASE_STAGES;
  const closedStage = stageOrder[stageOrder.length - 1];
  const activityLabelMap = isFuneral
    ? isGerman
      ? {
          event1: 'Bestattungsauftrag digitalisiert',
          event2: 'Trauerfeier terminiert',
          event3: 'Sterbefall in Planung',
          event4: 'Vorsorge aktualisiert',
        }
      : {
          event1: 'Funeral order digitized',
          event2: 'Memorial service scheduled',
          event3: 'Bereavement case in planning',
          event4: 'Pre-need updated',
        }
    : {
        event1: 'Invoice marked overdue',
        event2: 'Order confirmed',
        event3: 'Case escalated',
        event4: 'New client added',
      };

  const overdueInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === 'Overdue').length,
    [invoices],
  );

  const openCases = useMemo(
    () => cases.filter((entry) => entry.stage !== closedStage).length,
    [cases, closedStage],
  );

  const orderVolume = useMemo(() => aggregateOrdersByMonth(orders), [orders]);

  const casesByStage = useMemo(
    () => aggregateCasesByStage(cases, stageOrder, locale),
    [cases, isFuneral, locale, stageOrder],
  );

  const activityEvents = useMemo(
    () =>
      isFuneral
        ? [
            {
              id: 'evt_k1',
              label: activityLabelMap.event1,
              description: 'KUNZ-2026-0042 · Wallner Friedrich',
              timestamp: '2026-05-13T10:30:00Z',
              tone: 'success' as const,
            },
            {
              id: 'evt_k2',
              label: activityLabelMap.event2,
              description: 'KUNZ-2026-0042 · Pfarrkirche Pitten',
              timestamp: '2026-05-14T08:00:00Z',
              tone: 'info' as const,
            },
            {
              id: 'evt_k3',
              label: activityLabelMap.event3,
              description: 'KUNZ-2026-0038 · Huber Maria',
              timestamp: '2026-05-08T14:20:00Z',
              tone: 'default' as const,
            },
            {
              id: 'evt_k4',
              label: activityLabelMap.event4,
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
          ? `${profile.tagline} — ${i18n.subtitle}`
          : 'Workspace overview and recent activity'
      }
      icon={dashboardPageIcon()}
    >
      <div className={STAT_CARD_GRID_CLASS}>
        <StatCard
          label={profile.terminology.clients}
          value={String(clients.length)}
          icon={<ProjectsIcon size={18} weight="duotone" />}
          description={isFuneral ? i18n.clientsDescription : 'Active accounts'}
        />
        <StatCard
          label={profile.terminology.orders}
          value={String(orders.length)}
          icon={<OrderIcon size={18} weight="duotone" />}
          description={isFuneral ? i18n.ordersDescription : 'All statuses'}
        />
        <StatCard
          label={
            isFuneral ? `${i18n.openCasesLabelPrefix} ${profile.terminology.cases}` : 'Open cases'
          }
          value={String(openCases)}
          icon={<CaseIcon size={18} weight="duotone" />}
          delta={isFuneral ? `${cases.length} ${i18n.openCasesSuffix}` : `${cases.length} total`}
          trend="neutral"
        />
        <StatCard
          label={isFuneral ? `${profile.terminology.products} articles` : 'Invoices overdue'}
          value={isFuneral ? String(products.length) : String(overdueInvoices)}
          icon={<InvoiceIcon size={18} weight="duotone" />}
          trend={!isFuneral && overdueInvoices > 0 ? 'down' : 'neutral'}
          delta={
            isFuneral
              ? i18n.productsDeltaLabel
              : overdueInvoices > 0
                ? 'Needs attention'
                : 'All clear'
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={
            isFuneral
              ? `${i18n.orderChartTitlePrefix} ${profile.terminology.orders}`
              : 'Order volume'
          }
          meta={isFuneral ? i18n.orderChartMeta : 'Monthly totals from demo orders'}
          type="bar"
          data={orderVolume}
          valueFormatter={currencyFormatter}
        />

        <SectionCard
          title={
            isFuneral ? `${profile.terminology.cases} ${i18n.casesByStageLabel}` : 'Cases by stage'
          }
          meta={isFuneral ? i18n.casesByStageMeta : 'Open pipeline by stage'}
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
        title={isFuneral ? i18n.recentTitle : 'Recent activity'}
        meta={isFuneral ? i18n.recentMeta : 'Sample workspace events'}
      >
        <Timeline events={activityEvents} />
      </SectionCard>
    </ModulePage>
  );
}
