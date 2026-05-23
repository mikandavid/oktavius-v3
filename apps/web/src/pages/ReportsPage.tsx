import {
  SectionCard,
  SimpleBarChart,
  SimpleLineChart,
  StatCard,
} from '@oktavius/base-ui';

import { useDemoData } from '@/app/demo-data';
import { ModulePage } from '@/components/common/PageLayout';
import { reportsPageIcon } from '@/lib/modulePageIcons';
import { SuccessIcon, WarningIcon } from '@/lib/icons';

export function ReportsPage() {
  const { clients, orders, invoices } = useDemoData();

  const activeClients = clients.filter((c) => c.status === 'Active').length;
  const openOrders = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue').length;

  return (
    <ModulePage
      title="Reports"
      subtitle="Operational KPIs and revenue trends across modules."
      icon={reportsPageIcon()}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active clients" value={String(activeClients)} icon={<SuccessIcon size={16} />} />
        <StatCard label="Open orders" value={String(openOrders)} />
        <StatCard
          label="Overdue invoices"
          value={String(overdueInvoices)}
          icon={<WarningIcon size={16} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Revenue trend" meta="Last 5 months">
          <SimpleLineChart
            data={[
              { label: 'Jul', value: 42 },
              { label: 'Aug', value: 38 },
              { label: 'Sep', value: 51 },
              { label: 'Oct', value: 47 },
              { label: 'Nov', value: 58 },
            ]}
          />
        </SectionCard>
        <SectionCard title="Orders by status">
          <SimpleBarChart
            data={[
              { label: 'Confirmed', value: orders.filter((o) => o.status === 'Confirmed').length },
              { label: 'Shipped', value: orders.filter((o) => o.status === 'Shipped').length },
              { label: 'Delivered', value: orders.filter((o) => o.status === 'Delivered').length },
              { label: 'Draft', value: orders.filter((o) => o.status === 'Draft').length },
            ]}
            height={200}
          />
        </SectionCard>
      </div>

      <SectionCard title="Invoice aging" meta="By status">
        <SimpleBarChart
          data={[
            { label: 'Paid', value: invoices.filter((i) => i.status === 'Paid').length },
            { label: 'Sent', value: invoices.filter((i) => i.status === 'Sent').length },
            { label: 'Overdue', value: invoices.filter((i) => i.status === 'Overdue').length },
          ]}
          height={180}
        />
      </SectionCard>
    </ModulePage>
  );
}
