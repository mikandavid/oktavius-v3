import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { formatDisplayDateTime } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { IconDeleteButton } from '@/components/common/RecordIconButtons';
import { useDemoData } from '@/app/demo-data';
import { incidentsPageIcon } from '@/lib/modulePageIcons';
import { toast } from '@/lib/toast';

import { incidentSeverityBadge, incidentStatusBadge } from './shared';

export function IncidentDetailPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const { incidents } = useDemoData();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const incident = useMemo(
    () => incidents.find((entry) => entry.id === incidentId),
    [incidents, incidentId],
  );

  if (!incident) {
    return (
      <ModulePage title="Incident not found" icon={incidentsPageIcon()} backTo="/incidents">
        <p className="text-sm text-muted-foreground">This incident may have been removed.</p>
      </ModulePage>
    );
  }

  return (
    <>
      <ModulePage
        title={incident.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{incident.incidentNumber}</span>
            {incidentSeverityBadge(incident.severity)}
            {incidentStatusBadge(incident.status)}
          </span>
        }
        icon={incidentsPageIcon()}
        backTo="/incidents"
        actions={<IconDeleteButton onClick={() => setDeleteOpen(true)} label="Delete incident" />}
      >
        <DetailView
          title="Incident details"
          fields={[
            { label: 'Title', value: incident.title, importance: 'primary' },
            { label: 'Incident number', value: incident.incidentNumber, section: 'Identification' },
            {
              label: 'Severity',
              value: incidentSeverityBadge(incident.severity),
              section: 'Status',
            },
            {
              label: 'Status',
              value: incidentStatusBadge(incident.status),
              section: 'Status',
            },
            { label: 'Service', value: incident.service, section: 'Assignment' },
            { label: 'Assignee', value: incident.assignee, section: 'Assignment' },
            {
              label: 'Reported at',
              value: formatDisplayDateTime(incident.reportedAt),
              section: 'Timeline',
            },
            { label: 'Impact', value: incident.impact, section: 'Impact', importance: 'meta' },
          ]}
        />
      </ModulePage>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this incident?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          toast.success('Incident deleted.');
          navigate('/incidents');
        }}
      />
    </>
  );
}
