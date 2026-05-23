import { Link } from 'react-router-dom';

import {
  SectionCard,
  SimpleBarChart,
  SimpleLineChart,
  StatCard,
  buttonVariants,
  cn,
} from '@oktavius/base-ui';

import { useDemoData } from '@/app/demo-data';
import { ModulePage } from '@/components/common/PageLayout';
import { InfoBox } from '@/components/common/InfoBox';
import { dashboardPageIcon } from '@/lib/modulePageIcons';
import { InfoIcon, OrderIcon, ReportsIcon } from '@/lib/icons';

const QUICK_LINKS = [
  { label: 'Cases', path: '/cases' },
  { label: 'Incidents', path: '/incidents' },
  { label: 'Clients', path: '/clients' },
  { label: 'Contracts', path: '/contracts' },
  { label: 'Orders', path: '/orders' },
  { label: 'Invoices', path: '/invoices' },
  { label: 'Products', path: '/products' },
  { label: 'Projects', path: '/projects' },
  { label: 'Reports', path: '/reports' },
] as const;

export function DashboardPage() {
  const { clients, orders, invoices, projects, cases } = useDemoData();

  const activeClients = clients.filter((c) => c.status === 'Active').length;
  const openOrders = orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status)).length;
  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue').length;
  const activeProjects = projects.filter((p) => p.status === 'Active').length;
  const openCases = cases.filter((c) => c.stage !== 'Closed').length;

  return (
    <ModulePage
      title="Dashboard"
      subtitle="Operational overview across sales, billing, and delivery."
      icon={dashboardPageIcon()}
    >
      <InfoBox tone="info" icon={<InfoIcon size={18} weight="fill" />} title="Demo workspace">
        Sample ERP modules use in-memory demo data. Open any module from the sidebar or links below.
      </InfoBox>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Open cases" value={String(openCases)} />
        <StatCard label="Active clients" value={String(activeClients)} />
        <StatCard label="Open orders" value={String(openOrders)} icon={<OrderIcon size={16} />} />
        <StatCard label="Overdue invoices" value={String(overdueInvoices)} />
        <StatCard label="Active projects" value={String(activeProjects)} />
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
        <SectionCard title="Pipeline" meta="Orders by status">
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

      <SectionCard title="Modules" meta="Typical ERP pages">
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <Link
          to="/reports"
          className={cn(buttonVariants({ variant: 'cta', size: 'sm' }), 'mt-3 inline-flex')}
        >
          <ReportsIcon size={14} className="mr-1.5" />
          Open reports
        </Link>
      </SectionCard>
    </ModulePage>
  );
}
