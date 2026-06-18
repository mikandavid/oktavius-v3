/**
 * AutomationsList — prop-driven list component for the agent-admin automations section.
 *
 * Rebuilt (Task 3.7) with v3 base-ui primitives:
 *   - ListRow for each automation row (row is a <button> when onClick is set)
 *   - RecordVisual kind="icon" for the per-type icon (passed as `leading` to preserve testid)
 *   - Badge for the activation status pill (trailing slot)
 *   - InlineEmptyState for empty / error states
 *   - Skeleton for loading lines
 *   - SectionCard for the list container
 */

import { Badge, InlineEmptyState, ListRow, Skeleton } from '@oktavius/base-ui';
import { Button } from '@oktavius/base-ui';

import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { PlusIcon } from '@/lib/icons';
import { useScheduledTasks } from '@/modules/agent-admin/data/useScheduler';
import type { ScheduledTask } from '@/runtime/osiris/schedulerClient';

import {
  type AutomationActivationStatus,
  automationTypeIcon,
  deriveActivationStatus,
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

const STATUS_BADGE_VARIANT: Record<
  AutomationActivationStatus,
  'success' | 'secondary' | 'outline'
> = {
  scheduled: 'success',
  paused: 'secondary',
  completed: 'outline',
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
        <InlineEmptyState
          text={t('scheduler.automations.loadError', {}, 'Could not load automations.')}
          centered
        />
      ) : tasks.length === 0 ? (
        <InlineEmptyState
          text={t('scheduler.automations.empty', {}, 'No automations yet')}
          centered
        />
      ) : (
        <div className="pt-1">
          {tasks.map((task) => (
            <AutomationListItem key={task.id} task={task} onOpen={() => onOpen(task.id)} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AutomationListItem — uses ListRow + RecordVisual icon + Badge trailing
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
  const badgeVariant = STATUS_BADGE_VARIANT[status];

  const scheduledFor = task.nextRunAt
    ? formatDateTimeSimple(task.nextRunAt, { dateStyle: 'medium', timeStyle: 'short' })
    : task.scheduleType === 'once'
      ? t('scheduler.automations.noUpcomingRun', {}, 'No upcoming run')
      : describeSchedule(task, t, formatDateTimeSimple);

  // Icon tile: pass as `leading` so we can attach data-testid
  // RecordVisual kind="icon" renders a muted bg tile — we override className with the tone class
  const leadingNode = (
    <div
      data-testid={`automation-type-${label}`}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-control border ${toneClass}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </div>
  );

  return (
    <ListRow
      title={task.name}
      subtitle={scheduledFor}
      leading={leadingNode}
      trailing={<Badge variant={badgeVariant}>{t(STATUS_LABEL_KEY[status], {}, status)}</Badge>}
      onClick={onOpen}
    />
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function AutomationsListSkeleton() {
  return (
    <div className="space-y-2 pt-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="px-2 py-2.5">
          <Skeleton className="mb-1.5 h-3.5 w-[65%]" />
          <Skeleton className="h-2.5 w-[40%]" />
        </div>
      ))}
    </div>
  );
}
