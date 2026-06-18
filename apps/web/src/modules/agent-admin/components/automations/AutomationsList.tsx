/**
 * AutomationsList — prop-driven list component for the agent-admin automations section.
 *
 * Restyled (Task 3.6) to match David's ScheduledAgentActivationsPanel look:
 * per-row type icon box (heartbeat / email / halo / scheduled), name + scheduled-for
 * line, and status pill — while keeping create affordance and CRUD callbacks.
 */

import { Button, cn, Skeleton } from '@oktavius/base-ui';

import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { PlusIcon, TimeIcon } from '@/lib/icons';
import { useScheduledTasks } from '@/modules/agent-admin/data/useScheduler';
import type { ScheduledTask } from '@/runtime/osiris/schedulerClient';

import {
  type AutomationActivationStatus,
  automationTypeIcon,
  deriveActivationStatus,
  statusPillClass,
} from './automationIcons';
import { describeSchedule, formatDateTimeSimple, type TFunction } from './automationPresentation';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AutomationsListProps {
  onOpen: (taskId: string) => void;
  onCreate: () => void;
}

// ---------------------------------------------------------------------------
// Status label helpers
// ---------------------------------------------------------------------------

const STATUS_LABEL_KEY: Record<AutomationActivationStatus, string> = {
  scheduled: 'scheduler.automations.status.active',
  paused: 'scheduler.automations.status.paused',
  completed: 'scheduler.automations.status.completed',
};

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
      {/* Section header with create button */}
      <div className="flex items-center justify-between px-1">
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

      {/* List body */}
      {isLoading ? (
        <AutomationsListSkeleton />
      ) : isError ? (
        <EmptyAutomationsState
          message={t('scheduler.automations.loadError', {}, 'Could not load automations.')}
        />
      ) : tasks.length === 0 ? (
        <EmptyAutomationsState
          message={t('scheduler.automations.empty', {}, 'No automations yet')}
        />
      ) : (
        <div className="space-y-px pt-1">
          {tasks.map((task) => (
            <AutomationListItem key={task.id} task={task} onOpen={() => onOpen(task.id)} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AutomationListItem — David's ActivationListItem adapted to ScheduledTask
// ---------------------------------------------------------------------------

function AutomationListItem({
  task,
  onOpen,
  t,
}: {
  task: ScheduledTask;
  onOpen: () => void;
  t: TFunction;
}) {
  const { Icon, toneClass, label } = automationTypeIcon(task);
  const status = deriveActivationStatus(task);
  const pillClass = statusPillClass(status);

  const scheduledFor = task.nextRunAt
    ? formatDateTimeSimple(task.nextRunAt, { dateStyle: 'medium', timeStyle: 'short' })
    : task.scheduleType === 'once'
      ? t('scheduler.automations.noUpcomingRun', {}, 'No upcoming run')
      : describeSchedule(task, t, formatDateTimeSimple);

  return (
    <button
      type="button"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className="mx-1 flex w-[calc(100%-0.5rem)] cursor-pointer items-start gap-3 rounded-card border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border/40 hover:bg-muted/50"
    >
      {/* Type icon box */}
      <div
        data-testid={`automation-type-${label}`}
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-card border',
          toneClass,
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>

      {/* Text content */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium leading-snug text-foreground/90">
          {task.name}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground/70">{scheduledFor}</div>
        <div className="mt-1">
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide',
              pillClass,
            )}
          >
            {t(STATUS_LABEL_KEY[status], {}, status)}
          </span>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Skeleton + empty state
// ---------------------------------------------------------------------------

function AutomationsListSkeleton() {
  return (
    <div className="space-y-2 pt-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="mx-1 px-3 py-2.5">
          <Skeleton className="mb-1.5 h-3.5 w-[65%]" />
          <Skeleton className="h-2.5 w-[40%]" />
        </div>
      ))}
    </div>
  );
}

function EmptyAutomationsState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-card bg-muted/40">
        <TimeIcon className="h-5 w-5 text-muted-foreground/35" aria-hidden="true" />
      </div>
      <p className="text-[13px] text-muted-foreground/70">{message}</p>
    </div>
  );
}
