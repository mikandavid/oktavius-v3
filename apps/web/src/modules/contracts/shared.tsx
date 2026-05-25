import type { BadgeProps } from '@oktavius/base-ui';

import type { CrudColumn } from '@/components/data/CrudTable';
import { statusColumn } from '@/components/data/columns';
import type { FilterDef } from '@/components/data/FilterToolbar';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import type { ContractRecord } from '@/app/demo-data';
import { contractsPageIcon } from '@/lib/modulePageIcons';

export { contractsPageIcon };

export const CONTRACT_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  Draft: 'secondary',
  Active: 'success',
  Expiring: 'warning',
  Terminated: 'destructive',
};

export const contractColumns: CrudColumn<ContractRecord>[] = [
  { key: 'contractNumber', header: 'Number', sortable: true },
  { key: 'title', header: 'Title', sortable: true },
  { key: 'clientName', header: 'Client', sortable: true },
  statusColumn('status', 'Status', CONTRACT_STATUS_VARIANT),
  { key: 'value', header: 'Value', sortable: true, type: 'currency', align: 'right' },
  { key: 'startDate', header: 'Start', sortable: true, type: 'date', hideBelow: 'md' },
  { key: 'endDate', header: 'End', sortable: true, type: 'date', hideBelow: 'lg' },
  { key: 'owner', header: 'Owner', sortable: true, hideBelow: 'lg' },
];

export const contractFilters: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'Draft', label: 'Draft' },
      { value: 'Active', label: 'Active' },
      { value: 'Expiring', label: 'Expiring' },
      { value: 'Terminated', label: 'Terminated' },
    ],
  },
  {
    key: 'clientName',
    label: 'Client',
    options: [
      { value: 'Apex Technologies GmbH', label: 'Apex Technologies GmbH' },
      { value: 'Bruckner Consulting', label: 'Bruckner Consulting' },
      { value: 'Donau Logistics AG', label: 'Donau Logistics AG' },
    ],
  },
  {
    key: 'owner',
    label: 'Owner',
    options: [
      { value: 'Anna Hofer', label: 'Anna Hofer' },
      { value: 'Markus Leitner', label: 'Markus Leitner' },
      { value: 'Nina Weiss', label: 'Nina Weiss' },
    ],
  },
];

export function contractStatusBadge(status: ContractRecord['status']) {
  return <StatusBadge status={status} variantMap={CONTRACT_STATUS_VARIANT} />;
}
