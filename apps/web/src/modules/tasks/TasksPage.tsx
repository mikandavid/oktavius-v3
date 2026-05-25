import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { TaskInbox, type TaskInboxItem } from '@/components/workflow/TaskInbox';
import { useDemoData } from '@/app/demo-data';
import { tasksPageIcon } from '@/lib/modulePageIcons';
import { toast } from '@/lib/toast';

const STATUS_MAP = {
  Pending: 'Open',
  Active: 'In progress',
  Completed: 'Done',
} as const;

const PRIORITY_MAP = {
  Pending: 'Normal',
  Active: 'High',
  Completed: 'Low',
} as const;

function toInboxItem(task: {
  id: string;
  title: string;
  parentType: string;
  assignee: string;
  dueDate: string;
  status: 'Pending' | 'Active' | 'Completed';
}): TaskInboxItem {
  return {
    id: task.id,
    title: task.title,
    module: task.parentType.charAt(0).toUpperCase() + task.parentType.slice(1),
    assignee: task.assignee,
    dueAt: task.dueDate,
    priority: PRIORITY_MAP[task.status],
    status: STATUS_MAP[task.status],
  };
}

export function TasksPage() {
  const navigate = useNavigate();
  const { tasks } = useDemoData();

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'Completed').map(toInboxItem),
    [tasks],
  );

  const allTasks = useMemo(() => tasks.map(toInboxItem), [tasks]);

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find((entry) => entry.id === taskId);
    if (!task) return;

    const routes: Record<string, (id: string) => string> = {
      client: (id) => `/clients/${id}`,
      project: (id) => `/projects/${id}`,
      order: (id) => `/orders/${id}`,
      case: (id) => `/cases/${id}`,
    };

    const path = routes[task.parentType]?.(task.parentId);
    if (path) {
      navigate(path);
    } else {
      toast.info(`Task: ${task.title}`);
    }
  };

  return (
    <ModulePage
      title="Tasks"
      subtitle="Cross-module work queue assigned to your team"
      icon={tasksPageIcon()}
    >
      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="pt-4">
          <TaskInbox items={openTasks} onItemClick={handleTaskClick} title="Open tasks" />
        </TabsContent>
        <TabsContent value="all" className="pt-4">
          <TaskInbox items={allTasks} onItemClick={handleTaskClick} title="All tasks" />
        </TabsContent>
      </Tabs>
    </ModulePage>
  );
}
