import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { MoneyText, STAT_CARD_GRID_CLASS, StatCard } from '@oktavius/base-ui';

import { useApiRegistry } from '@/api/ApiProvider';
import { DetailView } from '@/components/common/DetailView';
import { RecordEditDialog } from '@/components/common/RecordEditDialog';
import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { runDetailDeleteAction } from '@/components/detail/detailDeleteAction';
import { DetailPageHeaderActions } from '@/components/detail/DetailPageHeaderActions';
import { EntityDetailWorkspaceTabs } from '@/components/detail/EntityDetailWorkspaceTabs';
import { GeneratedRelatedRecordsPanel } from '@/components/detail/relatedRecordsConfig';
import { useEntityAgentRegistration } from '@/components/detail/useEntityAgentRegistration';
import { useDemoData } from '@/app/demo-data';
import { projectsPageIcon } from '@/lib/modulePageIcons';
import { useUrlTabState } from '@/lib/routing/useUrlTabState';
import { submitApiForm } from '@/lib/apiFormSubmit';
import { appToast } from '@/lib/toast';

const PROJECT_DETAIL_TABS = ['overview', 'tasks', 'activity', 'files', 'assistant'] as const;

import { projectFormFields, projectStatusBadge, type ProjectFormValues } from './shared';
import { buildProjectDetailFields } from './projectDetailFields';
import { projectTasksRelationConfig } from './projectRelatedRecords';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const api = useApiRegistry();
  const { clients, projects, tasks } = useDemoData();
  const [activeTab, setActiveTab] = useUrlTabState('overview', PROJECT_DETAIL_TABS);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const project = useMemo(
    () => projects.find((entry) => entry.id === projectId),
    [projects, projectId],
  );

  const updateProjectInline = useCallback(
    async (input: Parameters<typeof api.projects.update>[1]) => {
      if (!project) return;
      try {
        await api.projects.update(project.id, input);
        appToast.success('Project updated.');
      } catch (error) {
        appToast.fromApiError(error, 'Project could not be updated.');
        throw error;
      }
    },
    [api, project],
  );

  const projectTasks = useMemo(
    () => (project ? tasks.filter((task) => projectTasksRelationConfig.match(project, task)) : []),
    [tasks, project],
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

  useEntityAgentRegistration(
    project
      ? {
          entityType: 'project',
          entityId: project.id,
          displayLabel: project.name,
        }
      : null,
    { moduleId: 'projects', moduleLabel: 'Projects' },
  );

  if (!project) {
    return (
      <ModulePage title="Project not found" icon={projectsPageIcon()} backTo="/projects">
        <p className="text-sm text-muted-foreground">This project may have been removed.</p>
      </ModulePage>
    );
  }

  const openTasks = projectTasks.filter((task) => task.status !== 'Completed').length;

  const editDefaults: ProjectFormValues = {
    name: project.name,
    clientName: project.clientName,
    status: project.status,
    manager: project.manager,
    startDate: project.startDate,
    endDate: project.endDate,
    budget: project.budget,
    completion: String(project.completion),
  };

  return (
    <>
      <ModulePage
        title={project.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{project.clientName}</span>
            {projectStatusBadge(project.status)}
          </span>
        }
        icon={projectsPageIcon()}
        backTo="/projects"
        actions={
          <DetailPageHeaderActions
            onEdit={() => setEditOpen(true)}
            editLabel="Edit project"
            onDelete={() => setDeleteOpen(true)}
            deleteLabel="Delete project"
          />
        }
      >
        <EntityDetailWorkspaceTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          entityType="project"
          entityId={project.id}
          overview={
            <>
              <div className={STAT_CARD_GRID_CLASS}>
                <StatCard label="Completion" value={`${project.completion}%`} />
                <StatCard
                  label="Budget"
                  value={<MoneyText value={Number(project.budget)} currency="EUR" />}
                />
                <StatCard label="Open tasks" value={String(openTasks)} />
                <StatCard label="Total tasks" value={String(projectTasks.length)} />
              </div>

              <DetailView
                title="Project summary"
                fields={buildProjectDetailFields({
                  project,
                  onInlineUpdate: updateProjectInline,
                  clientOptions: clientRelationOptions,
                })}
              />
            </>
          }
          extraTabs={[
            {
              value: 'tasks',
              label: 'Tasks',
              content: (
                <GeneratedRelatedRecordsPanel
                  config={projectTasksRelationConfig}
                  parent={project}
                  rows={tasks}
                />
              ),
            },
          ]}
        />
      </ModulePage>

      <RecordEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit project"
        fields={projectFormFields}
        defaultValues={editDefaults}
        isSubmitting={isSubmitting}
        onSubmit={async (values) => {
          setIsSubmitting(true);
          try {
            return await submitApiForm({
              action: () =>
                api.projects.update(project.id, {
                  ...values,
                  completion: Number.parseInt(values.completion, 10) || 0,
                }),
              onSuccess: () => {
                appToast.success('Project updated.');
              },
              onError: (error) => appToast.fromApiError(error, 'Project could not be updated.'),
            });
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this project?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          void runDetailDeleteAction({
            deleteRecord: () => api.projects.delete(project.id),
            navigate,
            redirectTo: '/projects',
            successMessage: 'Project deleted.',
            errorMessage: 'Project could not be deleted.',
            toast: appToast,
          });
        }}
      />
    </>
  );
}
