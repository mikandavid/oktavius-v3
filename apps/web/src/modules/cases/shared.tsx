import type { BadgeProps } from '@oktavius/base-ui';

import { PageHeaderCtaLink, PageHeaderOutlineLink } from '@/components/common/PageHeaderButtons';
import type { CrudColumn } from '@/components/data/CrudTable';
import { statusColumn } from '@/components/data/columns';
import type { FilterDef } from '@/components/data/FilterToolbar';
import type { FormField } from '@/components/forms/EntityForm';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import type { CaseRecord } from '@/app/demo-data';
import { PlusIcon, ProjectIcon } from '@/lib/icons';
import { casesPageIcon } from '@/lib/modulePageIcons';

export { casesPageIcon };

export const CASE_TYPE_VARIANT: Record<string, BadgeProps['variant']> = {
  Support: 'info',
  Legal: 'secondary',
  Billing: 'warning',
  Onboarding: 'success',
};

export const CASE_STAGE_VARIANT: Record<string, BadgeProps['variant']> = {
  Intake: 'secondary',
  Investigation: 'info',
  Resolution: 'warning',
  Closed: 'success',
};

export const CASE_PRIORITY_VARIANT: Record<string, BadgeProps['variant']> = {
  Low: 'secondary',
  Normal: 'info',
  High: 'warning',
  Critical: 'destructive',
};

export const CASE_SLA_VARIANT: Record<string, BadgeProps['variant']> = {
  ok: 'success',
  warning: 'warning',
  breach: 'destructive',
};

export const CASE_TYPES: CaseRecord['type'][] = ['Support', 'Legal', 'Billing', 'Onboarding'];
export const CASE_STAGES: CaseRecord['stage'][] = [
  'Intake',
  'Investigation',
  'Resolution',
  'Closed',
];
export const CASE_PRIORITIES: CaseRecord['priority'][] = ['Low', 'Normal', 'High', 'Critical'];

export const caseColumns: CrudColumn<CaseRecord>[] = [
  { key: 'caseNumber', header: 'Case #', sortable: true },
  { key: 'title', header: 'Title', sortable: true },
  statusColumn('type', 'Type', CASE_TYPE_VARIANT),
  statusColumn('stage', 'Stage', CASE_STAGE_VARIANT),
  statusColumn('priority', 'Priority', CASE_PRIORITY_VARIANT),
  { key: 'clientName', header: 'Client', sortable: true },
  { key: 'assignee', header: 'Assignee', sortable: true },
  { key: 'dueAt', header: 'Due', sortable: true, type: 'date' },
  {
    key: 'slaStatus',
    header: 'SLA',
    sortable: true,
    hideBelow: 'lg',
    render: (row) => caseSlaBadge(row.slaStatus),
  },
];

export const caseFilters: FilterDef[] = [
  {
    key: 'type',
    label: 'Type',
    options: CASE_TYPES.map((type) => ({ value: type, label: type })),
  },
  {
    key: 'stage',
    label: 'Stage',
    options: CASE_STAGES.map((stage) => ({ value: stage, label: stage })),
  },
  {
    key: 'priority',
    label: 'Priority',
    options: CASE_PRIORITIES.map((priority) => ({ value: priority, label: priority })),
  },
];

export type CaseFormValues = {
  title: string;
  type: CaseRecord['type'];
  stage: CaseRecord['stage'];
  priority: CaseRecord['priority'];
  clientName: string;
  assignee: string;
  dueAt: string;
  summary: string;
};

export const caseFormDefaults: CaseFormValues = {
  title: '',
  type: 'Support',
  stage: 'Intake',
  priority: 'Normal',
  clientName: '',
  assignee: '',
  dueAt: '',
  summary: '',
};

export const caseFormFields: FormField[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, section: 'Case' },
  {
    name: 'type',
    label: 'Type',
    type: 'combobox',
    options: CASE_TYPES,
    section: 'Case',
  },
  {
    name: 'stage',
    label: 'Stage',
    type: 'combobox',
    options: CASE_STAGES,
    section: 'Case',
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'combobox',
    options: CASE_PRIORITIES,
    section: 'Case',
  },
  {
    name: 'clientName',
    label: 'Client',
    type: 'combobox',
    options: [
      'Apex Technologies GmbH',
      'Bruckner Consulting',
      'Clara Sonnenschein',
      'Donau Logistics AG',
      'Eiger Software Ltd',
    ],
    required: true,
    section: 'Parties',
  },
  { name: 'assignee', label: 'Assignee', type: 'text', section: 'Parties' },
  { name: 'dueAt', label: 'Due date', type: 'date', section: 'Timeline' },
  { name: 'summary', label: 'Summary', type: 'textarea', colSpan: 2, section: 'Details' },
];

export function CasesBoardLink() {
  return (
    <PageHeaderOutlineLink to="/cases/board">
      <ProjectIcon size={14} />
      Board view
    </PageHeaderOutlineLink>
  );
}

export function CasesHeaderAction() {
  return (
    <>
      <CasesBoardLink />
      <PageHeaderCtaLink to="/cases/new">
        <PlusIcon size={14} />
        New case
      </PageHeaderCtaLink>
    </>
  );
}

export function caseTypeBadge(type: CaseRecord['type']) {
  return <StatusBadge status={type} variantMap={CASE_TYPE_VARIANT} />;
}

export function caseStageBadge(stage: CaseRecord['stage']) {
  return <StatusBadge status={stage} variantMap={CASE_STAGE_VARIANT} />;
}

export function casePriorityBadge(priority: CaseRecord['priority']) {
  return <StatusBadge status={priority} variantMap={CASE_PRIORITY_VARIANT} />;
}

export function caseSlaBadge(slaStatus: CaseRecord['slaStatus']) {
  const labels: Record<CaseRecord['slaStatus'], string> = {
    ok: 'On track',
    warning: 'At risk',
    breach: 'Breached',
  };
  return <StatusBadge status={slaStatus} label={labels[slaStatus]} variantMap={CASE_SLA_VARIANT} />;
}
