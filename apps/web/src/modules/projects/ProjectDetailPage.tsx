import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import {
  Avatar,
  Button,
  InlineEmptyState,
  ListRow,
  MoneyText,
  SectionCard,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Timeline,
  type TimelineEvent,
} from '@oktavius/base-ui';

import { useDemoData } from '@/app/demo-data';
import { DocumentPreviewPanel } from '@/components/documents/DocumentPreviewPanel';
import { ModulePage } from '@/components/common/PageLayout';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { formatDisplayDate } from '@/lib/formatDate';
import { SuccessIcon } from '@/lib/icons';

import { PROJECT_STATUS_MAP, projectsPageIcon } from './shared';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const { projects, tasks } = useDemoData();
  const [tab, setTab] = useState('overview');
  const [docId, setDocId] = useState('f1');

  const project = projects.find((p) => p.id === projectId);
  if (!project) return <Navigate to="/projects" replace />;

  const projectTasks = tasks.filter((t) => t.parentId === project.id && t.parentType === 'project');

  const activity: TimelineEvent[] = [
    {
      id: '1',
      label: 'Kick-off completed',
      timestamp: `${project.startDate}T09:00:00Z`,
      tone: 'success',
    },
    { id: '2', label: 'Sprint 4 started', timestamp: '2024-11-01T08:00:00Z', tone: 'info' },
    {
      id: '3',
      label: 'Budget review scheduled',
      timestamp: '2024-12-05T11:00:00Z',
      tone: 'warning',
    },
  ];

  return (
    <ModulePage
      title={project.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <span>
            {project.clientName} · {project.manager}
          </span>
          <StatusBadge status={project.status} variantMap={PROJECT_STATUS_MAP} />
        </span>
      }
      icon={projectsPageIcon()}
      backTo="/projects"
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks" attention={projectTasks.some((t) => t.status === 'Pending')}>
            Tasks
          </TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Completion"
              value={`${project.completion}%`}
              trend="up"
              delta="+8% this month"
              icon={<SuccessIcon size={16} />}
            />
            <StatCard label="Budget" value={<MoneyText value={project.budget} />} />
            <StatCard label="End date" value={formatDisplayDate(project.endDate)} />
          </div>
          <SectionCard title="Recent activity">
            <Timeline events={activity} />
          </SectionCard>
          <SectionCard title="Upcoming tasks" meta="Top 3">
            {projectTasks.slice(0, 3).map((task) => (
              <ListRow
                key={task.id}
                title={task.title}
                subtitle={`${task.assignee} · due ${formatDisplayDate(task.dueDate)}`}
                leading={<Avatar label={task.assignee} size="sm" />}
                trailing={<StatusBadge status={task.status} />}
              />
            ))}
            {projectTasks.length > 3 ? (
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setTab('tasks')}>
                View all tasks
              </Button>
            ) : null}
          </SectionCard>
        </TabsContent>

        <TabsContent value="tasks" className="pt-4">
          <SectionCard
            title="Tasks"
            meta={`${projectTasks.length} open`}
            actions={
              <Button variant="outline" size="sm">
                Add task
              </Button>
            }
          >
            {projectTasks.length ? (
              projectTasks.map((task) => (
                <ListRow
                  key={task.id}
                  title={task.title}
                  subtitle={`Due ${formatDisplayDate(task.dueDate)} · ${task.assignee}`}
                  leading={<Avatar label={task.assignee} size="sm" tone="accent" />}
                  trailing={<StatusBadge status={task.status} />}
                />
              ))
            ) : (
              <InlineEmptyState text="No tasks on this project." centered />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="documents" className="pt-4">
          <SectionCard title="Project documents">
            <DocumentPreviewPanel selectedId={docId} onSelect={setDocId} />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </ModulePage>
  );
}
