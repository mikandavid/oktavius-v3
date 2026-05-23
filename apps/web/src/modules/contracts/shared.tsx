import type { ContractRecord } from '@/app/demo-data';
import type { CrudColumn } from '@/components/data/CrudTable';
import { StatusBadge } from '@/components/feedback/StatusBadge';

const CONTRACT_STATUS_MAP = {
  Draft: 'warning',
  Active: 'success',
  Expiring: 'warning',
  Terminated: 'destructive',
} as const;

export const contractColumns: CrudColumn<ContractRecord>[] = [
  {
    key: 'contractNumber',
    header: 'Contract',
    sortable: true,
    render: (row) => (
      <div>
        <p className="font-medium text-foreground">{row.contractNumber}</p>
        <p className="text-xs text-muted-foreground">{row.title}</p>
      </div>
    ),
  },
  { key: 'clientName', header: 'Client', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => <StatusBadge status={row.status} variantMap={CONTRACT_STATUS_MAP} />,
  },
  {
    key: 'value',
    header: 'Value',
    sortable: true,
    type: 'currency',
    align: 'right',
    meta: { currencySymbol: '€' },
    render: (row) => row.value,
  },
  { key: 'endDate', header: 'Ends', sortable: true, type: 'date', hideBelow: 'md' },
  { key: 'owner', header: 'Owner', sortable: true, hideBelow: 'lg' },
];

export { CONTRACT_STATUS_MAP };

export { contractsPageIcon } from '@/lib/modulePageIcons';
