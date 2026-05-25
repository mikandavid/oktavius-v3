import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Badge,
  InlineEmptyState,
  ListRow,
  MoneyText,
  STAT_CARD_GRID_CLASS,
  SectionCard,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  formatDisplayDate,
} from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { IconDeleteButton } from '@/components/common/RecordIconButtons';
import { useDemoData } from '@/app/demo-data';
import { projectsPageIcon } from '@/lib/modulePageIcons';
import { toast } from '@/lib/toast';

import { projectStatusBadge } from './shared';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, tasks } = useDemoData();
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const project = useMemo(
    () => projects.find((entry) => entry.id === projectId),
    [projects, projectId],
  );

  const projectTasks = useMemo(
    () => tasks.filter((task) => task.parentId === projectId && task.parentType === 'project'),
    [tasks, projectId],
  );

  if (!project) {
    return (
      <ModulePage title="Project not found" icon={projectsPageIcon()} backTo="/projects">
        <p className="text-sm text-muted-foreground">This project may have been removed.</p>
      </ModulePage>
    );
  }

  const openTasks = projectTasks.filter((task) => task.status !== 'Completed').length;

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
        actions={<IconDeleteButton onClick={() => setDeleteOpen(true)} label="Delete project" />}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className={STAT_CARD_GRID_CLASS}>
              <StatCard label="Completion" value={`${project.completion}%`} />
              <StatCard
                label="Budget"
                value={<MoneyText value={Number(project.budget)} currency="EUR" />}
              />
              <StatCard label="Open tasks" value={String(openTasks)} />
              <StatCard label="Total tasks" value={String(projectTasks.length)} />
            </div>

            <SectionCard title="Project summary">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Client</dt>
                  <dd className="text-sm">{project.clientName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Manager</dt>
                  <dd className="text-sm">{project.manager}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Status</dt>
                  <dd className="text-sm">{projectStatusBadge(project.status)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Timeline</dt>
                  <dd className="text-sm">
                    {formatDisplayDate(project.startDate)} – {formatDisplayDate(project.endDate)}
                  </dd>
                </div>
              </dl>
            </SectionCard>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4 pt-4">
            <SectionCard title="Tasks" meta={`${projectTasks.length} items`}>
              {projectTasks.map((task) => (
                <ListRow
                  key={task.id}
                  title={task.title}
                  subtitle={task.assignee}
                  meta={formatDisplayDate(task.dueDate)}
                  trailing={<Badge variant="outline">{task.status}</Badge>}
                />
              ))}
              {projectTasks.length === 0 ? (
                <InlineEmptyState text="No tasks linked to this project." centered />
              ) : null}
            </SectionCard>
          </TabsContent>
        </Tabs>
      </ModulePage>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this project?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          toast.success('Project deleted.');
          navigate('/projects');
        }}
      />
    </>
  );
}
