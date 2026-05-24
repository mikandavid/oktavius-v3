import { Badge } from '@oktavius/base-ui';

import { PageHeaderCtaLink, PageHeaderOutlineLink } from '@/components/common/PageHeaderButtons';
import type { CaseRecord } from '@/app/demo-data';
import type { CrudColumn } from '@/components/data/CrudTable';
import type { FormField } from '@/components/forms/EntityForm';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { PlusIcon } from '@/lib/icons';

export const CASE_STAGES = ['Intake', 'Investigation', 'Resolution', 'Closed'] as const;

const CASE_STATUS_MAP = {
  Intake: 'info',
  Investigation: 'warning',
  Resolution: 'info',
  Closed: 'success',
} as const;

export const CASE_PRIORITY_MAP = {
  Low: 'secondary',
  Normal: 'info',
  High: 'warning',
  Critical: 'destructive',
} as const;

/** @deprecated Use CASE_PRIORITY_MAP with StatusBadge */
export const PRIORITY_VARIANT = CASE_PRIORITY_MAP;

export const caseColumns: CrudColumn<CaseRecord>[] = [
  {
    key: 'caseNumber',
    header: 'Case',
    sortable: true,
    render: (row) => (
      <div className="min-w-0">
        <p className="font-medium text-foreground">{row.caseNumber}</p>
        <p className="truncate text-xs text-muted-foreground">{row.title}</p>
      </div>
    ),
  },
  { key: 'clientName', header: 'Client', sortable: true, hideBelow: 'md' },
  {
    key: 'type',
    header: 'Type',
    sortable: true,
    hideBelow: 'lg',
    render: (row) => <Badge variant="outline">{row.type}</Badge>,
  },
  {
    key: 'stage',
    header: 'Stage',
    sortable: true,
    render: (row) => <StatusBadge status={row.stage} variantMap={CASE_STATUS_MAP} />,
  },
  {
    key: 'priority',
    header: 'Priority',
    sortable: true,
    render: (row) => <StatusBadge status={row.priority} variantMap={CASE_PRIORITY_MAP} />,
  },
  { key: 'assignee', header: 'Owner', sortable: true, hideBelow: 'lg' },
  { key: 'dueAt', header: 'Due', sortable: true, type: 'date', hideBelow: 'md' },
];

export function CasesHeaderActions() {
  return (
    <>
      <PageHeaderOutlineLink to="/cases/board">Board view</PageHeaderOutlineLink>
      <PageHeaderCtaLink to="/cases/new">
        <PlusIcon size={14} />
        New case
      </PageHeaderCtaLink>
    </>
  );
}

export { CASE_STATUS_MAP };

export { casesPageIcon } from '@/lib/modulePageIcons';

export const checklistFormFields: FormField[] = [
  {
    name: 'label',
    label: 'Checklist item',
    type: 'text',
    required: true,
    section: 'Item',
    colSpan: 2,
  },
  {
    name: 'required',
    label: 'Required before case close',
    type: 'checkbox',
    section: 'Item',
    colSpan: 2,
  },
];

export type ChecklistFormValues = {
  label: string;
  required: boolean;
};

export const checklistFormDefaults: ChecklistFormValues = {
  label: '',
  required: true,
};
