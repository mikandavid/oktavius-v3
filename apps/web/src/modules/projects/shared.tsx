import type { BadgeProps } from '@oktavius/base-ui';

import type { CrudColumn } from '@/components/data/CrudTable';
import { statusColumn } from '@/components/data/columns';
import type { FilterDef } from '@/components/data/FilterToolbar';
import type { SavedViewPreset } from '@/components/data/useListSavedViews';
import type { FormField } from '@/components/forms/EntityForm';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import type { ProjectRecord } from '@/app/demo-data';
import { projectsPageIcon } from '@/lib/modulePageIcons';

export { projectsPageIcon };

export const PROJECT_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  Planning: 'secondary',
  Active: 'success',
  'On hold': 'warning',
  Completed: 'info',
};

export const projectColumns: CrudColumn<ProjectRecord>[] = [
  { key: 'name', header: 'Project', sortable: true },
  { key: 'clientName', header: 'Client', sortable: true },
  statusColumn('status', 'Status', PROJECT_STATUS_VARIANT),
  { key: 'manager', header: 'Manager', sortable: true, hideBelow: 'md' },
  {
    key: 'budget',
    header: 'Budget',
    sortable: true,
    type: 'currency',
    align: 'right',
    hideBelow: 'md',
  },
  {
    key: 'completion',
    header: 'Completion',
    sortable: true,
    hideBelow: 'lg',
    render: (row) => `${row.completion}%`,
  },
  { key: 'startDate', header: 'Start', sortable: true, type: 'date', hideBelow: 'lg' },
  { key: 'endDate', header: 'End', sortable: true, type: 'date', hideBelow: 'lg' },
];

export const projectFilters: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'Planning', label: 'Planning' },
      { value: 'Active', label: 'Active' },
      { value: 'On hold', label: 'On hold' },
      { value: 'Completed', label: 'Completed' },
    ],
  },
  {
    key: 'manager',
    label: 'Manager',
    options: [
      { value: 'Anna Hofer', label: 'Anna Hofer' },
      { value: 'Markus Leitner', label: 'Markus Leitner' },
      { value: 'Nina Weiss', label: 'Nina Weiss' },
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
];

export function projectStatusBadge(status: ProjectRecord['status']) {
  return <StatusBadge status={status} variantMap={PROJECT_STATUS_VARIANT} />;
}

export type ProjectFormValues = {
  name: string;
  clientName: string;
  status: ProjectRecord['status'];
  manager: string;
  startDate: string;
  endDate: string;
  budget: string;
  completion: string;
};

export const projectFormFields: FormField[] = [
  { name: 'name', label: 'Project name', type: 'text', required: true, section: 'Project' },
  { name: 'clientName', label: 'Client', type: 'text', required: true, section: 'Parties' },
  {
    name: 'status',
    label: 'Status',
    type: 'combobox',
    options: ['Planning', 'Active', 'On hold', 'Completed'],
    section: 'Project',
  },
  { name: 'manager', label: 'Manager', type: 'text', section: 'Assignment' },
  { name: 'startDate', label: 'Start', type: 'date', section: 'Timeline' },
  { name: 'endDate', label: 'End', type: 'date', section: 'Timeline' },
  { name: 'budget', label: 'Budget', type: 'currency', currencySymbol: '€', section: 'Commercial' },
  { name: 'completion', label: 'Completion %', type: 'number', section: 'Progress' },
];

export const PROJECT_SAVED_VIEWS: SavedViewPreset[] = [
  {
    id: 'all',
    label: 'All projects',
    isDefault: true,
    filters: { status: '', manager: '', clientName: '' },
  },
  { id: 'active', label: 'Active', filters: { status: 'Active', manager: '', clientName: '' } },
  {
    id: 'planning',
    label: 'Planning',
    filters: { status: 'Planning', manager: '', clientName: '' },
  },
];
