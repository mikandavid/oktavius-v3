import { Badge } from '@oktavius/base-ui';

import type { OrganizationRecord, PlatformUserRow } from '@/app/demo-data';
import { PageHeaderCtaLink } from '@/components/common/PageHeaderButtons';
import type { CrudColumn } from '@/components/data/CrudTable';
import { formatDisplayDate } from '@/lib/formatDate';
import { PlusIcon } from '@/lib/icons';

const ORG_STATUS_MAP = {
  Active: 'success',
  Trial: 'info',
  Suspended: 'warning',
  Churned: 'destructive',
} as const;

const PLAN_VARIANT: Record<OrganizationRecord['plan'], 'secondary' | 'info' | 'default'> = {
  Starter: 'secondary',
  Professional: 'info',
  Enterprise: 'default',
};

export const organizationColumns: CrudColumn<OrganizationRecord>[] = [
  {
    key: 'name',
    header: 'Organization',
    sortable: true,
    render: (row) => (
      <div className="min-w-0">
        <p className="font-medium text-foreground">{row.name}</p>
        <p className="truncate text-xs text-muted-foreground">{row.slug}</p>
      </div>
    ),
  },
  {
    key: 'plan',
    header: 'Plan',
    sortable: true,
    hideBelow: 'md',
    render: (row) => <Badge variant={PLAN_VARIANT[row.plan]}>{row.plan}</Badge>,
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    type: 'status',
    meta: { variantMap: ORG_STATUS_MAP },
  },
  {
    key: 'environment',
    header: 'Environment',
    sortable: true,
    hideBelow: 'lg',
    render: (row) => <Badge variant="outline">{row.environment}</Badge>,
  },
  { key: 'region', header: 'Region', sortable: true, hideBelow: 'lg' },
  { key: 'memberCount', header: 'Members', sortable: true, align: 'right', hideBelow: 'sm' },
  {
    key: 'createdAt',
    header: 'Created',
    sortable: true,
    hideBelow: 'md',
    render: (row) => formatDisplayDate(row.createdAt),
  },
];

export const platformUserColumns: CrudColumn<PlatformUserRow>[] = [
  { key: 'name', header: 'User', sortable: true },
  { key: 'email', header: 'Email', sortable: true, hideBelow: 'md' },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    type: 'status',
  },
  {
    key: 'isSuperadmin',
    header: 'Platform',
    sortable: true,
    hideBelow: 'sm',
    render: (row) =>
      row.isSuperadmin ? (
        <Badge variant="default">Superadmin</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: 'organizationCount',
    header: 'Orgs',
    sortable: true,
    align: 'right',
    hideBelow: 'lg',
  },
  {
    key: 'organizationNames',
    header: 'Organizations',
    hideBelow: 'md',
    render: (row) => (
      <span className="line-clamp-2 text-sm text-muted-foreground">{row.organizationNames}</span>
    ),
  },
];

export function superadminHeaderAction() {
  return (
    <PageHeaderCtaLink to="/superadmin/orgs/new">
      <PlusIcon size={14} />
      New organization
    </PageHeaderCtaLink>
  );
}

export { ORG_STATUS_MAP };

export { organizationPageIcon, superadminPageIcon } from '@/lib/modulePageIcons';
