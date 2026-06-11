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
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { CaseIcon, InvoiceIcon, OrderIcon, ProjectsIcon } from '@/lib/icons';
import { dashboardPageIcon } from '@/lib/modulePageIcons';
import { useOrgProfile } from '@/lib/org-profiles/useOrgProfile';
import { useUserPreferences, type UiLocale } from '@/lib/userPreferences';

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
  locale: UiLocale,
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
const EMPTY_DASHBOARD_CLIENTS: unknown[] = [];
const EMPTY_DASHBOARD_ORDERS: Array<{ orderDate: string; total: string }> = [];
const EMPTY_DASHBOARD_CASES: Array<{ stage: string }> = [];
const EMPTY_DASHBOARD_INVOICES: Array<{ status: string }> = [];
const EMPTY_DASHBOARD_PRODUCTS: unknown[] = [];

const CASE_STAGE_LABEL_MAP_BY_LOCALE: Record<UiLocale, Record<string, string>> = {
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
};

function localizeDashboardCaseStage(stage: string, locale: UiLocale) {
  const map = CASE_STAGE_LABEL_MAP_BY_LOCALE[locale];
  return map[stage] ?? stage;
}

export function DashboardPage() {
  const { ready } = usePreloadNamespaces(['dashboard']);
  const clients = EMPTY_DASHBOARD_CLIENTS;
  const orders = EMPTY_DASHBOARD_ORDERS;
  const cases = EMPTY_DASHBOARD_CASES;
  const invoices = EMPTY_DASHBOARD_INVOICES;
  const products = EMPTY_DASHBOARD_PRODUCTS;
  const profile = useOrgProfile();
  const { t } = useTranslation();
  const isFuneral = profile.industryKey === 'funeral';
  const { locale } = useUserPreferences();
  const stageOrder = isFuneral ? FUNERAL_CASE_STAGES : GENERIC_CASE_STAGES;
  const closedStage = stageOrder[stageOrder.length - 1];

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
    [cases, locale, stageOrder],
  );

  const activityEvents = useMemo(() => [], []);

  const currencyFormatter = (value: number) => `€${value.toLocaleString('de-AT')}`;

  if (!ready) return null;

  const subtitle = isFuneral
    ? `${profile.tagline} — ${t('dashboard.subtitleOverview')}`
    : t('dashboard.subtitleWorkspace');

  return (
    <ModulePage
      title={profile.terminology.dashboard}
      subtitle={subtitle}
      icon={dashboardPageIcon()}
    >
      <div className={STAT_CARD_GRID_CLASS}>
        <StatCard
          label={profile.terminology.clients}
          value={String(clients.length)}
          icon={<ProjectsIcon size={18} weight="duotone" />}
          description={t('dashboard.statClientsDescription')}
        />
        <StatCard
          label={profile.terminology.orders}
          value={String(orders.length)}
          icon={<OrderIcon size={18} weight="duotone" />}
          description={t('dashboard.statOrdersDescription')}
        />
        <StatCard
          label={
            isFuneral
              ? `${t('dashboard.statOpenCases')} (${profile.terminology.cases})`
              : t('dashboard.statOpenCases')
          }
          value={String(openCases)}
          icon={<CaseIcon size={18} weight="duotone" />}
          delta={`${cases.length} ${t('dashboard.statTotalSuffix')}`}
          trend="neutral"
        />
        <StatCard
          label={isFuneral ? `${profile.terminology.products}` : t('dashboard.statInvoicesOverdue')}
          value={isFuneral ? String(products.length) : String(overdueInvoices)}
          icon={<InvoiceIcon size={18} weight="duotone" />}
          trend={!isFuneral && overdueInvoices > 0 ? 'down' : 'neutral'}
          delta={
            isFuneral
              ? profile.terminology.products
              : overdueInvoices > 0
                ? t('dashboard.statNeedsAttention')
                : t('dashboard.statAllClear')
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={
            isFuneral
              ? `${t('dashboard.orderVolumeTitle')} — ${profile.terminology.orders}`
              : t('dashboard.orderVolumeTitle')
          }
          meta={t('dashboard.orderVolumeMeta')}
          type="bar"
          data={orderVolume}
          valueFormatter={currencyFormatter}
        />

        <SectionCard
          title={
            isFuneral
              ? `${profile.terminology.cases} — ${t('dashboard.casesByStageTitle')}`
              : t('dashboard.casesByStageTitle')
          }
          meta={t('dashboard.casesByStageMeta')}
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
        title={t('dashboard.recentActivityTitle')}
        meta={t('dashboard.recentActivityMeta')}
      >
        <Timeline events={activityEvents} />
      </SectionCard>
    </ModulePage>
  );
}
