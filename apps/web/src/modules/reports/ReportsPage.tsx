import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { ChartCard, type ChartPoint } from '@oktavius/base-ui';

import { createConfiguredReportStore } from '@/api/apiStoreConfig';
import { useApiRegistry } from '@/api/ApiProvider';
import { ModulePage } from '@/components/common/PageLayout';
import { MODULE_TABS_CONTENT_SCROLL_CLASS } from '@/components/common/pageChrome';
import { getWindowStorage } from '@/lib/storage/safeStorage';
import {
  COMBO_DATA,
  MULTI_LINE_REVENUE,
  PIPELINE_FUNNEL,
  RADAR_KPIS,
  RADAR_SERIES,
  ReportBuilderPanel,
  REVENUE_SERIES,
  STACKED_PIPELINE,
  TOP_CLIENTS,
} from '@/components/reports/ReportBuilderPanel';
import { reportsPageIcon } from '@/lib/modulePageIcons';

const REPORTS_PAGE_SIZE = '250';

function sumAmounts(items: Array<{ amount?: string; total?: string }>, key: 'amount' | 'total') {
  return items.reduce((sum, item) => {
    const raw = key === 'amount' ? item.amount : item.total;
    return sum + Number.parseFloat(raw ?? '0');
  }, 0);
}

function aggregateByMonth(items: Array<{ date: string; value: number }>): ChartPoint[] {
  const buckets = new Map<string, number>();

  for (const item of items) {
    const month = item.date.slice(0, 7);
    buckets.set(month, (buckets.get(month) ?? 0) + item.value);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value: Math.round(value) }));
}

export function ReportsPage() {
  const api = useApiRegistry();
  const storage = getWindowStorage('localStorage');
  const reportStore = useMemo(
    () =>
      createConfiguredReportStore({
        storageKey: 'reports',
        storage,
        env: import.meta.env,
      }),
    [storage],
  );
  const reportsQuery = useQuery({
    queryKey: ['reports-page-summary'],
    queryFn: async () => {
      const [orders, invoices] = await Promise.all([
        api.orders.list({ pageSize: REPORTS_PAGE_SIZE, sort: '-orderDate' }),
        api.invoices.list({ pageSize: REPORTS_PAGE_SIZE, sort: '-issuedAt' }),
      ]);

      return {
        orders: orders.data,
        invoices: invoices.data,
      };
    },
  });
  const orders = reportsQuery.data?.orders ?? [];
  const invoices = reportsQuery.data?.invoices ?? [];

  const ordersTrend = useMemo(
    () =>
      aggregateByMonth(
        orders.map((order) => ({
          date: order.orderDate,
          value: Number.parseFloat(order.total),
        })),
      ),
    [orders],
  );
  const revenueTrend = useMemo(
    () =>
      aggregateByMonth(
        invoices.map((invoice) => ({
          date: invoice.issuedAt,
          value: Number.parseFloat(invoice.amount),
        })),
      ),
    [invoices],
  );

  const paidVsOpen = useMemo(() => {
    const paid = invoices
      .filter((invoice) => invoice.status === 'Paid')
      .reduce((sum, invoice) => sum + Number.parseFloat(invoice.amount), 0);
    const open = invoices
      .filter((invoice) => invoice.status === 'Sent' || invoice.status === 'Overdue')
      .reduce((sum, invoice) => sum + Number.parseFloat(invoice.amount), 0);

    return [
      { label: 'Paid', value: Math.round(paid) },
      { label: 'Open', value: Math.round(open) },
    ];
  }, [invoices]);

  const orderStatusMix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const order of orders) {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, value]) => ({ label, value }));
  }, [orders]);

  const totalRevenue = sumAmounts(invoices, 'amount');
  const totalOrders = sumAmounts(orders, 'total');

  return (
    <ModulePage
      title="Reports"
      subtitle={`€${totalRevenue.toLocaleString('de-AT')} invoiced · €${totalOrders.toLocaleString('de-AT')} ordered`}
      icon={reportsPageIcon()}
      fillHeight
    >
      <div className={MODULE_TABS_CONTENT_SCROLL_CLASS}>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <ChartCard
            title="Revenue trend"
            meta="Issued invoice amounts by month"
            type="area"
            data={revenueTrend}
            valueFormatter={(value) => `€${value.toLocaleString('de-AT')}`}
          />
          <ChartCard
            title="Revenue vs margin"
            meta="Multi-line comparison"
            type="multi-line"
            multiSeriesData={MULTI_LINE_REVENUE}
            series={REVENUE_SERIES}
            valueFormatter={(value) => `€${value.toLocaleString('de-AT')}`}
          />
          <ChartCard
            title="Orders + revenue"
            meta="Volume vs value"
            type="combo"
            comboData={COMBO_DATA}
            barLabel="Orders"
            lineLabel="Revenue"
            valueFormatter={(value) =>
              value > 500 ? `€${value.toLocaleString('de-AT')}` : String(value)
            }
          />
          <ChartCard
            title="Order value trend"
            meta="Order totals by month"
            type="line"
            data={ordersTrend}
            valueFormatter={(value) => `€${value.toLocaleString('de-AT')}`}
          />
          <ChartCard
            title="Top clients"
            meta="Revenue share"
            type="horizontal-bar"
            data={TOP_CLIENTS}
            valueFormatter={(value) => `€${value}k`}
          />
          <ChartCard
            title="Invoice collection"
            meta="Paid vs open balances"
            type="pie"
            data={paidVsOpen}
            valueFormatter={(value) => `€${value.toLocaleString('de-AT')}`}
          />
          <ChartCard
            title="Team KPIs"
            meta="Actual vs target"
            type="radar"
            radarData={RADAR_KPIS}
            series={RADAR_SERIES}
          />
          <ChartCard
            title="Orders by status"
            meta="Current pipeline mix"
            type="bar"
            data={orderStatusMix}
          />
          <ChartCard
            title="Pipeline by quarter"
            meta="Stacked new / active / won"
            type="stacked-bar"
            stackedData={STACKED_PIPELINE}
          />
          <ChartCard
            title="Sales funnel"
            meta="Lead to won conversion"
            type="funnel"
            funnelData={PIPELINE_FUNNEL}
          />
          <ChartCard
            title="Collection rate"
            meta="Paid invoices vs total issued"
            type="gauge"
            gaugeValue={Math.round(((paidVsOpen[0]?.value ?? 0) / Math.max(totalRevenue, 1)) * 100)}
            gaugeLabel="Collected"
          />
        </div>

        <div className="mt-4">
          <ReportBuilderPanel store={reportStore} />
        </div>
      </div>
    </ModulePage>
  );
}
