import { useMemo } from 'react';

import { ChartCard, type ChartPoint } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { useDemoData } from '@/app/demo-data';
import { reportsPageIcon } from '@/lib/modulePageIcons';

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
  const { orders, invoices } = useDemoData();

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
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Revenue trend"
          meta="Issued invoice amounts by month"
          type="line"
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
          type="bar"
          data={paidVsOpen}
          valueFormatter={(value) => `€${value.toLocaleString('de-AT')}`}
        />
        <ChartCard
          title="Orders by status"
          meta="Current pipeline mix"
          type="bar"
          data={orderStatusMix}
        />
      </div>
    </ModulePage>
  );
}
