import type { IncidentRecord } from '@/app/demo-data';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { Badge } from '@oktavius/base-ui';

const INCIDENT_STATUS_MAP = {
  Open: 'destructive',
  Investigating: 'warning',
  Mitigated: 'info',
  Resolved: 'success',
} as const;

const SEVERITY_VARIANT: Record<
  IncidentRecord['severity'],
  'secondary' | 'info' | 'warning' | 'destructive'
> = {
  Low: 'secondary',
  Medium: 'info',
  High: 'warning',
  Critical: 'destructive',
};

export function IncidentSeverityBadge({ severity }: { severity: IncidentRecord['severity'] }) {
  return <Badge variant={SEVERITY_VARIANT[severity]}>{severity}</Badge>;
}

export function IncidentStatusBadge({ status }: { status: IncidentRecord['status'] }) {
  return <StatusBadge status={status} variantMap={INCIDENT_STATUS_MAP} />;
}

export { INCIDENT_STATUS_MAP };

export { incidentsPageIcon } from '@/lib/modulePageIcons';
