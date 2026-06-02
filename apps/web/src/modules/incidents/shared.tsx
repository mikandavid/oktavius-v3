import type { BadgeProps } from '@oktavius/base-ui';

import type { CrudColumn } from '@/components/data/CrudTable';
import { statusColumn } from '@/components/data/columns';
import type { FilterDef } from '@/components/data/FilterToolbar';
import type { SavedViewPreset } from '@/components/data/useListSavedViews';
import type { FormField } from '@/components/forms/EntityForm';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import type { IncidentRecord } from '@/app/demo-data';
import { incidentsPageIcon } from '@/lib/modulePageIcons';

export { incidentsPageIcon };

export const INCIDENT_SEVERITY_VARIANT: Record<string, BadgeProps['variant']> = {
  Low: 'secondary',
  Medium: 'warning',
  High: 'destructive',
  Critical: 'destructive',
};

export const INCIDENT_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  Open: 'destructive',
  Investigating: 'warning',
  Mitigated: 'info',
  Resolved: 'success',
};

export const incidentColumns: CrudColumn<IncidentRecord>[] = [
  { key: 'incidentNumber', header: 'Number', sortable: true },
  { key: 'title', header: 'Title', sortable: true },
  statusColumn('severity', 'Severity', INCIDENT_SEVERITY_VARIANT),
  statusColumn('status', 'Status', INCIDENT_STATUS_VARIANT),
  { key: 'service', header: 'Service', sortable: true, hideBelow: 'md' },
  { key: 'assignee', header: 'Assignee', sortable: true, hideBelow: 'md' },
  { key: 'reportedAt', header: 'Reported', sortable: true, type: 'date', hideBelow: 'lg' },
];

export const incidentFilters: FilterDef[] = [
  {
    key: 'severity',
    label: 'Severity',
    options: [
      { value: 'Low', label: 'Low' },
      { value: 'Medium', label: 'Medium' },
      { value: 'High', label: 'High' },
      { value: 'Critical', label: 'Critical' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'Open', label: 'Open' },
      { value: 'Investigating', label: 'Investigating' },
      { value: 'Mitigated', label: 'Mitigated' },
      { value: 'Resolved', label: 'Resolved' },
    ],
  },
  {
    key: 'service',
    label: 'Service',
    options: [
      { value: 'Public API', label: 'Public API' },
      { value: 'Notifications', label: 'Notifications' },
      { value: 'Reporting', label: 'Reporting' },
    ],
  },
];

export function incidentSeverityBadge(severity: IncidentRecord['severity']) {
  return <StatusBadge status={severity} variantMap={INCIDENT_SEVERITY_VARIANT} />;
}

export function incidentStatusBadge(status: IncidentRecord['status']) {
  return <StatusBadge status={status} variantMap={INCIDENT_STATUS_VARIANT} />;
}

export type IncidentFormValues = {
  title: string;
  incidentNumber: string;
  severity: IncidentRecord['severity'];
  status: IncidentRecord['status'];
  service: string;
  assignee: string;
  reportedAt: string;
  impact: string;
};

export const incidentFormFields: FormField[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, section: 'Incident' },
  { name: 'incidentNumber', label: 'Number', type: 'text', section: 'Identification' },
  {
    name: 'severity',
    label: 'Severity',
    type: 'combobox',
    options: ['Low', 'Medium', 'High', 'Critical'],
    section: 'Status',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'combobox',
    options: ['Open', 'Investigating', 'Mitigated', 'Resolved'],
    section: 'Status',
  },
  { name: 'service', label: 'Service', type: 'text', section: 'Assignment' },
  { name: 'assignee', label: 'Assignee', type: 'text', section: 'Assignment' },
  { name: 'reportedAt', label: 'Reported at', type: 'datetime', section: 'Timeline' },
  { name: 'impact', label: 'Impact', type: 'textarea', colSpan: 2, section: 'Impact' },
];

export const INCIDENT_SAVED_VIEWS: SavedViewPreset[] = [
  {
    id: 'all',
    label: 'All incidents',
    isDefault: true,
    filters: { severity: '', status: '', service: '' },
  },
  { id: 'open', label: 'Open', filters: { severity: '', status: 'Open', service: '' } },
  { id: 'critical', label: 'Critical', filters: { severity: 'Critical', status: '', service: '' } },
];
