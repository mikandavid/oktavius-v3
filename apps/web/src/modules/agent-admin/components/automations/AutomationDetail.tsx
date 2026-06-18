/**
 * AutomationDetail — prop-driven detail component for the agent-admin automations section.
 *
 * Rebuilt (Task 3.7) with v3 base-ui primitives:
 *   - SectionCard for detail card + run-history container (borderless white tile)
 *   - DetailFieldGrid + DetailFieldProps for labeled field rows
 *   - Badge for status value field
 *   - StatusDot tone="destructive" for failed run indicator
 *   - InlineEmptyState for empty / error run-history
 *   - Skeleton for loading
 *   - Button (base-ui) for Edit / pause / resume / run-now
 *   - ConfirmActionDialog + useTaskActions wiring preserved
 * v3 has no standalone conversation deep-link route — conversationId rendered as plain text.
 */

import {
  Badge,
  Button,
  DetailFieldGrid,
  type DetailFieldProps,
  InlineEmptyState,
  SectionCard,
  Skeleton,
  StatusDot,
} from '@oktavius/base-ui';
import { useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { BackIcon, MessageSquareIcon, ZapIcon } from '@/lib/icons';
import {
  useScheduledTask,
  useScheduledTaskRuns,
  useTaskActions,
} from '@/modules/agent-admin/data/useScheduler';
import type { ScheduledTask, ScheduledTaskRun } from '@/runtime/osiris/schedulerClient';

import { type AutomationActivationStatus, deriveActivationStatus } from './automationIcons';
import { describeSchedule, formatDateTimeSimple, type TFunction } from './automationPresentation';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AutomationDetailProps {
  taskId: string;
  onBack: () => void;
  onEdit: (taskId: string) => void;
}

// ---------------------------------------------------------------------------
// Status label key + badge variant mapping
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
// AutomationDetail
// ---------------------------------------------------------------------------

export function AutomationDetail({ taskId, onBack, onEdit }: AutomationDetailProps) {
  const { t } = useTranslation();
  const { ready } = usePreloadNamespaces(['scheduler', 'agent_admin']);

  const taskQuery = useScheduledTask(taskId);
  const runsQuery = useScheduledTaskRuns(taskId);
  const { pause, resume, runNow } = useTaskActions(taskId);

  const task = taskQuery.data;
  const runs = runsQuery.data?.data ?? [];

  const [confirmPauseOpen, setConfirmPauseOpen] = useState(false);
  const [confirmResumeOpen, setConfirmResumeOpen] = useState(false);
  const [confirmRunNowOpen, setConfirmRunNowOpen] = useState(false);

  if (!ready || taskQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <BackIcon className="mr-1.5 h-3.5 w-3.5" />
          {t('scheduler.automations.backToList', {}, 'Back to automations')}
        </Button>
        <div className="py-16 text-center text-sm text-muted-foreground">
          {t('scheduler.automations.notFoundHint', {}, 'This automation could not be found.')}
        </div>
      </div>
    );
  }

  return (
    <AutomationDetailInner
      task={task}
      runs={runs}
      runsQuery={runsQuery}
      pause={pause}
      resume={resume}
      runNow={runNow}
      confirmPauseOpen={confirmPauseOpen}
      setConfirmPauseOpen={setConfirmPauseOpen}
      confirmResumeOpen={confirmResumeOpen}
      setConfirmResumeOpen={setConfirmResumeOpen}
      confirmRunNowOpen={confirmRunNowOpen}
      setConfirmRunNowOpen={setConfirmRunNowOpen}
      onBack={onBack}
      onEdit={onEdit}
      t={t}
    />
  );
}

// ---------------------------------------------------------------------------
// AutomationDetailInner
// ---------------------------------------------------------------------------

function AutomationDetailInner({
  task,
  runs,
  runsQuery,
  pause,
  resume,
  runNow,
  confirmPauseOpen,
  setConfirmPauseOpen,
  confirmResumeOpen,
  setConfirmResumeOpen,
  confirmRunNowOpen,
  setConfirmRunNowOpen,
  onBack,
  onEdit,
  t,
}: {
  task: ScheduledTask;
  runs: ScheduledTaskRun[];
  runsQuery: { isLoading: boolean; isError: boolean };
  pause: { isPending: boolean; mutate: () => void };
  resume: { isPending: boolean; mutate: () => void };
  runNow: { isPending: boolean; mutate: () => void };
  confirmPauseOpen: boolean;
  setConfirmPauseOpen: (v: boolean) => void;
  confirmResumeOpen: boolean;
  setConfirmResumeOpen: (v: boolean) => void;
  confirmRunNowOpen: boolean;
  setConfirmRunNowOpen: (v: boolean) => void;
  onBack: () => void;
  onEdit: (taskId: string) => void;
  t: TFunction;
}) {
  const status = deriveActivationStatus(task);
  const badgeVariant = STATUS_BADGE_VARIANT[status];
  const isRecurring = task.scheduleType !== 'once';
  const isMutating = pause.isPending || resume.isPending || runNow.isPending;

  const prompt =
    typeof task.targetPayload?.['prompt'] === 'string' ? task.targetPayload['prompt'] : null;

  const recurrence = getRecurrenceLabel(task, t);

  // Build the DetailFieldGrid fields
  const scheduledForValue = task.nextRunAt
    ? formatDateTimeSimple(task.nextRunAt, { dateStyle: 'medium', timeStyle: 'short' })
    : task.scheduleType === 'once'
      ? t('scheduler.automations.noUpcomingRun', {}, 'No upcoming run')
      : describeSchedule(task, t, formatDateTimeSimple);

  const fields: DetailFieldProps[] = [
    {
      label: t('common.name', {}, 'Name'),
      value: task.name,
      importance: 'primary',
    },
    {
      label: t('scheduler.automations.scheduleLabel', {}, 'Scheduled for'),
      value: scheduledForValue,
    },
    ...(recurrence
      ? [
          {
            label: t('scheduler.automations.recurrenceLabel', {}, 'Recurrence'),
            value: recurrence,
          } satisfies DetailFieldProps,
        ]
      : []),
    {
      label: t('common.status', {}, 'Status'),
      value: <Badge variant={badgeVariant}>{t(STATUS_LABEL_KEY[status], {}, status)}</Badge>,
    },
    ...(prompt
      ? [
          {
            label: t('scheduler.automations.prompt', {}, 'Prompt'),
            value: (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {prompt}
              </p>
            ),
            colSpan: 2,
          } satisfies DetailFieldProps,
        ]
      : []),
    ...(task.lastRunAt
      ? [
          {
            label: t('scheduler.automations.lastRun', {}, 'Last run'),
            value: formatDateTimeSimple(task.lastRunAt, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
            importance: 'meta',
          } satisfies DetailFieldProps,
        ]
      : []),
  ];

  return (
    <div className="space-y-4 px-3 pb-4 pt-2" data-testid="automation-detail">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={onBack}
      >
        <BackIcon className="mr-1.5 h-3.5 w-3.5" />
        {t('scheduler.automations.backToList', {}, 'Back to automations')}
      </Button>

      {/* Detail card — SectionCard (borderless white tile) */}
      <SectionCard
        title={t('scheduler.automations.detailTitle', {}, 'Automation details')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => onEdit(task.id)}>
              {t('common.edit', {}, 'Edit')}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-8"
              disabled={isMutating}
              onClick={() => setConfirmRunNowOpen(true)}
            >
              <ZapIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t('scheduler.automations.runNow', {}, 'Run now')}
            </Button>
            {task.enabled ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={isMutating}
                onClick={() => setConfirmPauseOpen(true)}
              >
                {t('scheduler.automations.pause', {}, 'Pause')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={isMutating}
                onClick={() => setConfirmResumeOpen(true)}
              >
                {t('scheduler.automations.resume', {}, 'Resume')}
              </Button>
            )}
          </div>
        }
      >
        <DetailFieldGrid fields={fields} />
      </SectionCard>

      {/* Run history for recurring tasks */}
      {isRecurring ? (
        <AutomationRunHistory
          runs={runs}
          isLoading={runsQuery.isLoading}
          isError={runsQuery.isError}
          t={t}
        />
      ) : null}

      {/* Confirmation dialogs */}
      <ConfirmActionDialog
        open={confirmPauseOpen}
        onOpenChange={setConfirmPauseOpen}
        title={t('scheduler.automations.confirmPauseTitle', {}, 'Pause automation')}
        description={t(
          'scheduler.automations.confirmPauseDescription',
          {},
          'This automation will stop running on its schedule until resumed.',
        )}
        confirmLabel={t('scheduler.automations.pause', {}, 'Pause')}
        confirmVariant="cta"
        confirmDisabled={pause.isPending}
        onConfirm={() => {
          pause.mutate();
          setConfirmPauseOpen(false);
        }}
      />
      <ConfirmActionDialog
        open={confirmResumeOpen}
        onOpenChange={setConfirmResumeOpen}
        title={t('scheduler.automations.confirmResumeTitle', {}, 'Resume automation')}
        description={t(
          'scheduler.automations.confirmResumeDescription',
          {},
          'This automation will resume running on its schedule.',
        )}
        confirmLabel={t('scheduler.automations.resume', {}, 'Resume')}
        confirmVariant="cta"
        confirmDisabled={resume.isPending}
        onConfirm={() => {
          resume.mutate();
          setConfirmResumeOpen(false);
        }}
      />
      <ConfirmActionDialog
        open={confirmRunNowOpen}
        onOpenChange={setConfirmRunNowOpen}
        title={t('scheduler.automations.confirmRunNowTitle', {}, 'Run automation now')}
        description={t(
          'scheduler.automations.confirmRunNowDescription',
          {},
          'This will trigger a manual run of the automation immediately.',
        )}
        confirmLabel={t('scheduler.automations.runNow', {}, 'Run now')}
        confirmVariant="cta"
        confirmDisabled={runNow.isPending}
        onConfirm={() => {
          runNow.mutate();
          setConfirmRunNowOpen(false);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AutomationRunHistory — SectionCard container + InlineEmptyState
// ---------------------------------------------------------------------------

function AutomationRunHistory({
  runs,
  isLoading,
  isError,
  t,
}: {
  runs: ScheduledTaskRun[];
  isLoading: boolean;
  isError: boolean;
  t: TFunction;
}) {
  return (
    <SectionCard title={t('scheduler.automations.runHistory', {}, 'Run history')}>
      {/* data-testid anchors preserved for test selectors */}
      <span data-testid="run-history-header" className="sr-only">
        {t('scheduler.automations.runHistory', {}, 'Run history')}
      </span>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : isError ? (
        <InlineEmptyState
          text={t('scheduler.automations.runsLoadError', {}, 'Could not load run history.')}
        />
      ) : runs.length === 0 ? (
        <InlineEmptyState text={t('scheduler.automations.runsEmpty', {}, 'No runs yet.')} />
      ) : (
        <div className="divide-y divide-border/50">
          {runs.map((run) => (
            <RunHistoryRow key={run.id} run={run} t={t} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// RunHistoryRow
// ---------------------------------------------------------------------------

function RunHistoryRow({ run, t }: { run: ScheduledTaskRun; t: TFunction }) {
  const isFailed = run.status === 'failed' || run.status === 'dead_letter';

  return (
    <div className="flex w-full items-center justify-between gap-3 py-2.5 text-left">
      <div className="flex items-center gap-1.5">
        {isFailed ? (
          <StatusDot
            tone="destructive"
            size="sm"
            aria-label={t('scheduler.automations.runFailed', {}, 'Failed')}
          />
        ) : null}
        <span data-testid="run-timestamp" className="text-sm text-foreground/90">
          {formatDateTimeSimple(run.finishedAt ?? run.scheduledFor, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </span>
      </div>
      {/* v3 has no standalone conversation deep-link route — render as plain text */}
      {run.conversationId ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <MessageSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {t('scheduler.automations.viewChat', {}, 'View chat')}
        </span>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recurrence label helper
// ---------------------------------------------------------------------------

function getRecurrenceLabel(task: ScheduledTask, t: TFunction): string | null {
  if (task.scheduleType === 'once') return null;
  const typeLabel =
    task.scheduleType === 'cron'
      ? t('scheduler.automations.recurrenceCron', {}, 'Cron')
      : t('scheduler.automations.recurrenceInterval', {}, 'Interval');
  return `${typeLabel}: ${task.scheduleExpression} (${task.timezone})`;
}
