import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { ChartCard, type ChartPoint } from '@oktavius/base-ui';

import { createConfiguredReportStore } from '@/api/apiStoreConfig';
import { useApiRegistry } from '@/api/ApiProvider';
import { ModulePage } from '@/components/common/PageLayout';
import { MODULE_TABS_CONTENT_SCROLL_CLASS } from '@/components/common/pageChrome';
import { ReportBuilderPanel } from '@/components/reports/ReportBuilderPanel';
import { useActiveLocation } from '@/lib/locations/ActiveLocationContext';
import { getWindowStorage } from '@/lib/storage/safeStorage';
import { reportsPageIcon } from '@/lib/modulePageIcons';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

const REPORTS_PAGE_SIZE = '250';

type ReportOrder = {
  id: string;
  orderDate: string;
  total: string;
  status: string;
};

type ReportInvoice = {
  id: string;
  issuedAt: string;
  amount: string;
  status: string;
};

const EMPTY_REPORT_ORDERS: ReportOrder[] = [];
const EMPTY_REPORT_INVOICES: ReportInvoice[] = [];

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
  const osirisRuntime = useOptionalOsirisRuntime();
  const activeOrgId = osirisRuntime?.activeOrgId ?? null;
  const { activeLocationId, viewAllLocations } = useActiveLocation();
  const activeSiteScope = viewAllLocations ? null : activeLocationId;
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
    queryKey: ['scope', activeOrgId, activeSiteScope, 'reports-page-summary'],
    queryFn: async () => {
      const [orders, invoices] = await Promise.all([
        api.orders.list({ pageSize: REPORTS_PAGE_SIZE, sort: '-orderDate' }),
        api.invoices.list({ pageSize: REPORTS_PAGE_SIZE, sort: '-issuedAt' }),
      ]);

      return {
        orders: orders.data as ReportOrder[],
        invoices: invoices.data as ReportInvoice[],
      };
    },
  });
  const orders = reportsQuery.data?.orders ?? EMPTY_REPORT_ORDERS;
  const invoices = reportsQuery.data?.invoices ?? EMPTY_REPORT_INVOICES;

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
            title="Order value trend"
            meta="Order totals by month"
            type="line"
            data={ordersTrend}
            valueFormatter={(value) => `€${value.toLocaleString('de-AT')}`}
          />
          <ChartCard
            title="Invoice collection"
            meta="Paid vs open balances"
            type="pie"
            data={paidVsOpen}
            valueFormatter={(value) => `€${value.toLocaleString('de-AT')}`}
          />
          <ChartCard
            title="Orders by status"
            meta="Current pipeline mix"
            type="bar"
            data={orderStatusMix}
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
