import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useApiRegistry } from '@/api/ApiProvider';
import { RecordEditDialog } from '@/components/common/RecordEditDialog';
import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { runDetailDeleteAction } from '@/components/detail/detailDeleteAction';
import { DetailPageHeaderActions } from '@/components/detail/DetailPageHeaderActions';
import { EntityDetailWorkspaceTabs } from '@/components/detail/EntityDetailWorkspaceTabs';
import { useEntityAgentRegistration } from '@/components/detail/useEntityAgentRegistration';
import { useDemoData } from '@/app/demo-data';
import { incidentsPageIcon } from '@/lib/modulePageIcons';
import { useUrlTabState } from '@/lib/routing/useUrlTabState';
import { submitApiForm } from '@/lib/apiFormSubmit';
import { appToast } from '@/lib/toast';

const INCIDENT_DETAIL_TABS = ['overview', 'activity', 'files', 'assistant'] as const;

import {
  incidentFormFields,
  incidentSeverityBadge,
  incidentStatusBadge,
  type IncidentFormValues,
} from './shared';
import { buildIncidentDetailFields } from './incidentDetailFields';

export function IncidentDetailPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const api = useApiRegistry();
  const { incidents, users } = useDemoData();
  const [activeTab, setActiveTab] = useUrlTabState('overview', INCIDENT_DETAIL_TABS);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incident = useMemo(
    () => incidents.find((entry) => entry.id === incidentId),
    [incidents, incidentId],
  );

  const updateIncidentInline = useCallback(
    async (input: Parameters<typeof api.incidents.update>[1]) => {
      if (!incident) return;
      try {
        await api.incidents.update(incident.id, input);
        appToast.success('Incident updated.');
      } catch (error) {
        appToast.fromApiError(error, 'Incident could not be updated.');
        throw error;
      }
    },
    [api, incident],
  );
  const assigneeRelationOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.name,
        label: user.name,
        description: [user.team, user.role].filter(Boolean).join(' · '),
      })),
    [users],
  );

  useEntityAgentRegistration(
    incident
      ? {
          entityType: 'incident',
          entityId: incident.id,
          displayLabel: incident.title,
        }
      : null,
    { moduleId: 'incidents', moduleLabel: 'Incidents' },
  );

  if (!incident) {
    return (
      <ModulePage title="Incident not found" icon={incidentsPageIcon()} backTo="/incidents">
        <p className="text-sm text-muted-foreground">This incident may have been removed.</p>
      </ModulePage>
    );
  }

  const editDefaults: IncidentFormValues = {
    title: incident.title,
    incidentNumber: incident.incidentNumber,
    severity: incident.severity,
    status: incident.status,
    service: incident.service,
    assignee: incident.assignee,
    reportedAt: incident.reportedAt,
    impact: incident.impact,
  };

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
        actions={
          <DetailPageHeaderActions
            onEdit={() => setEditOpen(true)}
            editLabel="Edit incident"
            onDelete={() => setDeleteOpen(true)}
            deleteLabel="Delete incident"
          />
        }
      >
        <EntityDetailWorkspaceTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          entityType="incident"
          entityId={incident.id}
          overview={
            <DetailView
              title="Incident details"
              fields={buildIncidentDetailFields({
                incident,
                onInlineUpdate: updateIncidentInline,
                assigneeOptions: assigneeRelationOptions,
              })}
            />
          }
        />
      </ModulePage>

      <RecordEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit incident"
        fields={incidentFormFields}
        defaultValues={editDefaults}
        isSubmitting={isSubmitting}
        onSubmit={async (values) => {
          setIsSubmitting(true);
          try {
            return await submitApiForm({
              action: () => api.incidents.update(incident.id, values),
              onSuccess: () => {
                appToast.success('Incident updated.');
              },
              onError: (error) => appToast.fromApiError(error, 'Incident could not be updated.'),
            });
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this incident?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          void runDetailDeleteAction({
            deleteRecord: () => api.incidents.delete(incident.id),
            navigate,
            redirectTo: '/incidents',
            successMessage: 'Incident deleted.',
            errorMessage: 'Incident could not be deleted.',
            toast: appToast,
          });
        }}
      />
    </>
  );
}
