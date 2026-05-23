import type { ProjectRecord } from '@/app/demo-data';
import type { CrudColumn } from '@/components/data/CrudTable';
import { StatusBadge } from '@/components/feedback/StatusBadge';

const PROJECT_STATUS_MAP = {
  Planning: 'info',
  Active: 'success',
  'On hold': 'warning',
  Completed: 'secondary',
} as const;

export const projectColumns: CrudColumn<ProjectRecord>[] = [
  {
    key: 'name',
    header: 'Project',
    sortable: true,
    render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
  },
  { key: 'clientName', header: 'Client', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => <StatusBadge status={row.status} variantMap={PROJECT_STATUS_MAP} />,
  },
  { key: 'manager', header: 'Manager', sortable: true, hideBelow: 'md' },
  {
    key: 'budget',
    header: 'Budget',
    sortable: true,
    type: 'currency',
    align: 'right',
    meta: { currencySymbol: '€' },
    hideBelow: 'lg',
    render: (row) => row.budget,
  },
  {
    key: 'completion',
    header: 'Progress',
    sortable: true,
    align: 'right',
    hideBelow: 'lg',
    render: (row) => `${row.completion}%`,
  },
];

export { PROJECT_STATUS_MAP };

export { projectsPageIcon } from '@/lib/modulePageIcons';
