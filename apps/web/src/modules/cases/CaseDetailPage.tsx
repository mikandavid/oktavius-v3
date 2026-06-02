import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Button,
  STAT_CARD_GRID_CLASS,
  SectionCard,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Timeline,
  formatDisplayDate,
} from '@oktavius/base-ui';

import { useApiRegistry } from '@/api/ApiProvider';
import { ModuleScopedAssistantPanel } from '@/components/agent/ModuleScopedAssistantPanel';
import { AuditTrailPanel } from '@/components/audit/AuditTrailPanel';
import { ModulePage } from '@/components/common/PageLayout';
import { ChecklistSection } from '@/components/common/ChecklistSection';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import { runDetailDeleteAction } from '@/components/detail/detailDeleteAction';
import { DetailPageHeaderActions } from '@/components/detail/DetailPageHeaderActions';
import { GeneratedRelatedRecordsPanel } from '@/components/detail/relatedRecordsConfig';
import { useEntityAgentRegistration } from '@/components/detail/useEntityAgentRegistration';
import { buildPlaceMapsUrl } from '@/components/maps/AddressMapAction';
import { AddressMapSection } from '@/components/maps/AddressMapSection';
import { EntityStoragePanel } from '@/components/storage/EntityStoragePanel';
import { CommentsPanel, type CommentItem } from '@/components/workflow/CommentsPanel';
import { useDemoData } from '@/app/demo-data';
import { useEnsureDemoOrgForRecord } from '@/lib/demo/useEnsureDemoOrg';
import { PlusIcon } from '@/lib/icons';
import { useOrgProfile } from '@/lib/org-profiles/useOrgProfile';
import { useUrlTabState } from '@/lib/routing/useUrlTabState';
import { appToast } from '@/lib/toast';

const CASE_DETAIL_TABS = [
  'overview',
  'workflow',
  'comments',
  'activity',
  'files',
  'assistant',
] as const;

import { createCasePartiesRelationConfig } from './caseRelatedRecords';
import { buildCaseDetailFields } from './caseDetailFields';
import {
  casePriorityBadge,
  caseSlaBadge,
  caseStageBadge,
  caseTypeBadge,
  casesPageIcon,
} from './shared';
import { useCasesModuleConfig } from './useCasesModuleConfig';

const checklistFormFields = [
  { name: 'label', label: 'Item', type: 'text' as const, required: true },
];

export function CaseDetailPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const api = useApiRegistry();
  const { clients, findCaseById, parties, caseChecklists, users } = useDemoData();
  const moduleConfig = useCasesModuleConfig();
  const orgProfile = useOrgProfile();
  const [activeTab, setActiveTab] = useUrlTabState('overview', CASE_DETAIL_TABS);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);

  const caseRecord = useMemo(() => findCaseById(caseId), [caseId, findCaseById]);
  useEnsureDemoOrgForRecord(caseRecord);

  const updateCaseInline = useCallback(
    async (input: Parameters<typeof api.cases.update>[1]) => {
      if (!caseRecord) return;
      try {
        await api.cases.update(caseRecord.id, input);
        appToast.success('Case updated.');
      } catch (error) {
        appToast.fromApiError(error, 'Case could not be updated.');
        throw error;
      }
    },
    [api, caseRecord],
  );

  const casePartiesRelationConfig = useMemo(
    () =>
      createCasePartiesRelationConfig({
        title: orgProfile.industryKey === 'funeral' ? 'Beteiligte' : 'Parties',
        basePath: moduleConfig.basePath,
      }),
    [moduleConfig.basePath, orgProfile.industryKey],
  );

  const caseParties = useMemo(
    () =>
      caseRecord
        ? parties.filter((party) => casePartiesRelationConfig.match(caseRecord, party))
        : [],
    [casePartiesRelationConfig, caseRecord, parties],
  );
  const clientRelationOptions = useMemo(
    () =>
      clients.map((client) => ({
        value: client.name,
        label: client.name,
        description: [client.city, client.industry].filter(Boolean).join(' · '),
      })),
    [clients],
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

  const checklistItems = useMemo(
    () => caseChecklists.filter((item) => item.caseId === caseId),
    [caseChecklists, caseId],
  );

  const checklistDone = checklistItems.filter((item) => item.done).length;
  const openTasks = checklistItems.filter((item) => !item.done).length;

  useEntityAgentRegistration(
    caseRecord
      ? {
          entityType: 'case',
          entityId: caseRecord.id,
          displayLabel: caseRecord.caseNumber,
        }
      : null,
    { moduleId: 'cases', moduleLabel: moduleConfig.listTitle },
  );

  if (!caseRecord) {
    return (
      <ModulePage title="Case not found" icon={casesPageIcon()} backTo={moduleConfig.basePath}>
        <p className="text-sm text-muted-foreground">This case may have been removed.</p>
      </ModulePage>
    );
  }

  const timelineEvents = [
    {
      id: 'opened',
      label: 'Case opened',
      description: `${caseRecord.caseNumber} · ${caseRecord.type}`,
      timestamp: caseRecord.openedAt,
      tone: 'info' as const,
    },
    {
      id: 'due',
      label: 'Due date',
      description: `Assigned to ${caseRecord.assignee || 'Unassigned'}`,
      timestamp: caseRecord.dueAt,
      tone: caseRecord.slaStatus === 'breach' ? ('destructive' as const) : ('default' as const),
    },
    ...(caseRecord.stage === 'Closed'
      ? [
          {
            id: 'closed',
            label: 'Case closed',
            description: caseRecord.summary,
            timestamp: caseRecord.dueAt,
            tone: 'success' as const,
          },
        ]
      : []),
  ];
  const burialSiteMapsUrl = buildPlaceMapsUrl(caseRecord.burialSite, 'AT');
  const locationSiteMapsUrl = buildPlaceMapsUrl(caseRecord.locationSite, 'AT');

  const workflowAttention = checklistItems.some((item) => item.required && !item.done);

  return (
    <>
      <ModulePage
        title={caseRecord.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{caseRecord.clientName}</span>
            {caseTypeBadge(caseRecord.type)}
            {caseStageBadge(caseRecord.stage)}
            {casePriorityBadge(caseRecord.priority)}
            {caseSlaBadge(caseRecord.slaStatus)}
          </span>
        }
        icon={casesPageIcon()}
        backTo={moduleConfig.basePath}
        actions={
          <DetailPageHeaderActions
            editTo={`${moduleConfig.basePath}/${caseRecord.id}/edit`}
            editLabel={moduleConfig.isFuneral ? 'Bearbeiten' : 'Edit case'}
            onDelete={() => setDeleteOpen(true)}
            deleteLabel={moduleConfig.isFuneral ? 'Sterbefall löschen' : 'Delete case'}
          />
        }
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflow" attention={workflowAttention}>
              Workflow
            </TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="assistant">Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className={STAT_CARD_GRID_CLASS}>
              <StatCard label="Stage" value={caseRecord.stage} />
              <StatCard
                label="SLA"
                value={
                  caseRecord.slaStatus === 'ok'
                    ? 'On track'
                    : caseRecord.slaStatus === 'warning'
                      ? 'At risk'
                      : 'Breached'
                }
              />
              <StatCard
                label="Checklist"
                value={`${checklistDone}/${checklistItems.length || 0}`}
              />
              <StatCard label="Parties" value={String(caseParties.length)} />
              <StatCard label="Open items" value={String(openTasks)} />
              <StatCard label="Due" value={formatDisplayDate(caseRecord.dueAt)} />
            </div>

            <SectionCard title="Timeline">
              <Timeline events={timelineEvents} />
            </SectionCard>

            <DetailView
              title="Case summary"
              fields={buildCaseDetailFields({
                caseRecord,
                onInlineUpdate: updateCaseInline,
                assigneeOptions: assigneeRelationOptions,
                clientOptions: clientRelationOptions,
              })}
            />

            {caseRecord.deceasedName ? (
              <SectionCard title="Verstorbene/r">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium text-foreground">{caseRecord.deceasedName}</dd>
                  </div>
                  {caseRecord.dateOfDeath ? (
                    <div>
                      <dt className="text-muted-foreground">Sterbedatum</dt>
                      <dd className="font-medium text-foreground">
                        {formatDisplayDate(caseRecord.dateOfDeath)}
                      </dd>
                    </div>
                  ) : null}
                  {caseRecord.arrangementType ? (
                    <div>
                      <dt className="text-muted-foreground">Bestattungsart</dt>
                      <dd className="font-medium text-foreground">{caseRecord.arrangementType}</dd>
                    </div>
                  ) : null}
                  {caseRecord.burialSite ? (
                    <div>
                      <dt className="text-muted-foreground">Beisetzung</dt>
                      <dd className="font-medium text-foreground">{caseRecord.burialSite}</dd>
                    </div>
                  ) : null}
                  {caseRecord.locationSite ? (
                    <div>
                      <dt className="text-muted-foreground">Filiale</dt>
                      <dd className="font-medium text-foreground">{caseRecord.locationSite}</dd>
                    </div>
                  ) : null}
                </dl>
              </SectionCard>
            ) : null}

            {caseRecord.burialSite ? (
              <AddressMapSection
                title={`Map preview for ${caseRecord.burialSite}`}
                addressLines={[caseRecord.burialSite, 'Austria']}
                url={burialSiteMapsUrl}
              />
            ) : null}

            {caseRecord.locationSite ? (
              <AddressMapSection
                title={`Map preview for ${caseRecord.locationSite}`}
                addressLines={[caseRecord.locationSite, 'Austria']}
                url={locationSiteMapsUrl}
              />
            ) : null}

            <GeneratedRelatedRecordsPanel
              config={casePartiesRelationConfig}
              parent={caseRecord}
              rows={parties}
            />
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4 pt-4">
            <ChecklistSection
              title="Resolution checklist"
              items={checklistItems}
              onToggle={(id, done) => {
                void api.caseChecklists
                  .updateDone(id, done)
                  .catch((error) =>
                    appToast.fromApiError(error, 'Checklist item could not be updated.'),
                  );
              }}
              actions={
                <Button size="sm" variant="outline" onClick={() => setChecklistDialogOpen(true)}>
                  <PlusIcon size={14} />
                  Add item
                </Button>
              }
            />
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 pt-4">
            <CommentsPanel
              comments={comments}
              onSubmit={(body, internal) => {
                setComments((current) => [
                  {
                    id: `cmt_${Date.now()}`,
                    author: caseRecord.assignee || 'Team member',
                    body,
                    createdAt: new Date().toISOString(),
                    internal,
                  },
                  ...current,
                ]);
                appToast.success(internal ? 'Internal note posted.' : 'Comment posted.');
              }}
              placeholder="Add a note about this case…"
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 pt-4">
            <AuditTrailPanel entityType="case" entityId={caseRecord.id} />
          </TabsContent>

          <TabsContent value="files" className="space-y-4 pt-4">
            <EntityStoragePanel entityType="case" entityId={caseRecord.id} />
          </TabsContent>

          <TabsContent value="assistant" className="space-y-4 pt-4">
            <ModuleScopedAssistantPanel />
          </TabsContent>
        </Tabs>
      </ModulePage>

      <SubEntityFormDialog
        open={checklistDialogOpen}
        onOpenChange={setChecklistDialogOpen}
        title="Add checklist item"
        fields={checklistFormFields}
        defaultValues={{ label: '' }}
        submitLabel="Add item"
        onSubmit={async (values) => {
          await api.caseChecklists.create({
            caseId: caseRecord.id,
            label: String(values.label),
            required: true,
          });
          appToast.success('Checklist item added.');
        }}
      />

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this case?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          void runDetailDeleteAction({
            deleteRecord: () => api.cases.delete(caseRecord.id),
            navigate,
            redirectTo: moduleConfig.basePath,
            successMessage: 'Case deleted.',
            errorMessage: 'Case could not be deleted.',
            toast: appToast,
          });
        }}
      />
    </>
  );
}
