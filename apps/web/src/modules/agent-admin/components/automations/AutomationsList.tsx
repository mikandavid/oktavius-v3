/**
 * AutomationsList — prop-driven list component for the agent-admin automations section.
 *
 * Ported from osiris_erp AutomationsPage.tsx.
 * Router navigation replaced by onOpen/onCreate callbacks.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@oktavius/base-ui';
import type { ReactNode } from 'react';

import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { BotIcon, PlusIcon } from '@/lib/icons';
import { useScheduledTaskRuns, useScheduledTasks } from '@/modules/agent-admin/data/useScheduler';
import type { ScheduledTask, ScheduledTaskRunStatus } from '@/runtime/osiris/schedulerClient';

import {
  deriveAutomationStatus,
  describeSchedule,
  formatDateTimeSimple,
  RUN_STATUS_KEY,
  RUN_STATUS_VARIANT,
  TASK_STATUS_VARIANT,
} from './automationPresentation';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AutomationsListProps {
  onOpen: (taskId: string) => void;
  onCreate: () => void;
}

// ---------------------------------------------------------------------------
// Inline badge helpers
// ---------------------------------------------------------------------------

function TaskStatusBadge({
  task,
}: {
  task: Pick<ScheduledTask, 'enabled' | 'scheduleType' | 'lastRunAt'>;
}) {
  const { t } = useTranslation();
  const status = deriveAutomationStatus(task);
  return (
    <Badge variant={TASK_STATUS_VARIANT[status]}>
      {t(`scheduler.automations.status.${status}`)}
    </Badge>
  );
}

function RunStatusBadge({ status }: { status: ScheduledTaskRunStatus }) {
  const { t } = useTranslation();
  const variant = RUN_STATUS_VARIANT[status] ?? 'secondary';
  const key = RUN_STATUS_KEY[status];
  return (
    <Badge variant={variant}>
      {key ? t(`scheduler.automations.runStatus.${key}`) : t('common.unknown', {}, 'Unknown')}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// AutomationsList
// ---------------------------------------------------------------------------

export function AutomationsList({ onOpen, onCreate }: AutomationsListProps) {
  const { t } = useTranslation();
  const { ready } = usePreloadNamespaces(['scheduler', 'agent_admin']);

  const { data, isLoading, isError } = useScheduledTasks();
  const tasks = data?.data ?? [];

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t('scheduler.automations.title', {}, 'Automations')}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t('scheduler.automations.subtitle', {}, 'Scheduled and event-triggered automations')}
          </p>
        </div>
        <Button size="sm" onClick={onCreate}>
          <PlusIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {t('scheduler.automations.newAutomation', {}, 'New automation')}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <AutomationsTableSkeleton />
          ) : isError ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {t('scheduler.automations.loadError', {}, 'Could not load automations.')}
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <BotIcon className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm font-medium">
                {t('scheduler.automations.empty', {}, 'No automations yet')}
              </p>
              <p className="mt-1 text-xs">
                {t(
                  'scheduler.automations.emptyHint',
                  {},
                  'Create a scheduled or event-triggered automation to get started.',
                )}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('scheduler.automations.columns.name', {}, 'Name')}</TableHead>
                  <TableHead>
                    {t('scheduler.automations.columns.schedule', {}, 'Schedule')}
                  </TableHead>
                  <TableHead>{t('scheduler.automations.columns.status', {}, 'Status')}</TableHead>
                  <TableHead>
                    {t('scheduler.automations.columns.lastRun', {}, 'Last run')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <AutomationRow
                    key={task.id}
                    task={task}
                    onOpen={() => onOpen(task.id)}
                    RunStatusBadge={RunStatusBadge}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AutomationRow
// ---------------------------------------------------------------------------

function AutomationRow({
  task,
  onOpen,
  RunStatusBadge: RunBadge,
}: {
  task: ScheduledTask;
  onOpen: () => void;
  RunStatusBadge: (props: { status: ScheduledTaskRunStatus }) => ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <TableRow
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer"
    >
      <TableCell className="max-w-[320px]">
        <p className="truncate text-sm font-medium">{task.name}</p>
        {task.description ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.description}</p>
        ) : null}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {describeSchedule(task, t, formatDateTimeSimple)}
      </TableCell>
      <TableCell>
        <TaskStatusBadge task={task} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <LastRunCell task={task} RunBadge={RunBadge} />
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// LastRunCell
// ---------------------------------------------------------------------------

function LastRunCell({
  task,
  RunBadge,
}: {
  task: ScheduledTask;
  RunBadge: (props: { status: ScheduledTaskRunStatus }) => ReactNode;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useScheduledTaskRuns(task.lastRunAt ? task.id : undefined, 1);

  if (!task.lastRunAt) {
    return (
      <span className="text-sm text-muted-foreground">
        {t('scheduler.automations.noRunsYet', {}, 'No runs yet')}
      </span>
    );
  }

  const lastRun = data?.data?.[0];

  return (
    <div className="flex items-center gap-2">
      {isLoading && !lastRun ? (
        <Skeleton className="h-5 w-16" />
      ) : lastRun ? (
        <RunBadge status={lastRun.status} />
      ) : null}
      <span className="text-sm text-muted-foreground">
        {formatDateTimeSimple(task.lastRunAt, { dateStyle: 'medium', timeStyle: 'short' })}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function AutomationsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-9 w-[35%]" />
          <Skeleton className="h-9 w-[25%]" />
          <Skeleton className="h-9 w-[15%]" />
          <Skeleton className="h-9 w-[25%]" />
        </div>
      ))}
    </div>
  );
}
