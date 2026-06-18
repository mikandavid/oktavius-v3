/**
 * AutomationDetail — prop-driven detail component for the agent-admin automations section.
 *
 * Restyled (Task 3.6) to match David's ScheduledAgentActivationDetail look:
 * back button, rounded-card border bg-muted/20 p-4 detail card with DetailField rows,
 * and ActivationRunHistory styled run-history list for recurring tasks.
 *
 * CRUD actions (Edit, Pause/Resume, Run now) kept via ConfirmActionDialog + useTaskActions.
 * v3 has no standalone conversation deep-link route — conversationId rendered as plain text.
 */

import { Button, cn, Skeleton } from '@oktavius/base-ui';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { BackIcon, MessageSquareIcon, WarningIcon, ZapIcon } from '@/lib/icons';
import {
  useScheduledTask,
  useScheduledTaskRuns,
  useTaskActions,
} from '@/modules/agent-admin/data/useScheduler';
import type { ScheduledTask, ScheduledTaskRun } from '@/runtime/osiris/schedulerClient';

import {
  type AutomationActivationStatus,
  deriveActivationStatus,
  statusPillClass,
} from './automationIcons';
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
// Status label key
// ---------------------------------------------------------------------------

const STATUS_LABEL_KEY: Record<AutomationActivationStatus, string> = {
  scheduled: 'scheduler.automations.status.active',
  paused: 'scheduler.automations.status.paused',
  completed: 'scheduler.automations.status.completed',
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
// AutomationDetailInner (extracted to keep hook count manageable)
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
  const pillClass = statusPillClass(status);
  const isRecurring = task.scheduleType !== 'once';
  const isMutating = pause.isPending || resume.isPending || runNow.isPending;

  const prompt =
    typeof task.targetPayload?.['prompt'] === 'string' ? task.targetPayload['prompt'] : null;

  const recurrence = getRecurrenceLabel(task, t);

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

      {/* Detail card */}
      <div className="space-y-4 rounded-card border border-border/60 bg-muted/20 p-4">
        <DetailField label={t('common.name', {}, 'Name')} value={task.name} />
        <DetailField
          label={t('scheduler.automations.scheduleLabel', {}, 'Scheduled for')}
          value={
            task.nextRunAt
              ? formatDateTimeSimple(task.nextRunAt, { dateStyle: 'medium', timeStyle: 'short' })
              : task.scheduleType === 'once'
                ? t('scheduler.automations.noUpcomingRun', {}, 'No upcoming run')
                : describeSchedule(task, t, formatDateTimeSimple)
          }
        />
        {recurrence ? (
          <DetailField
            label={t('scheduler.automations.recurrenceLabel', {}, 'Recurrence')}
            value={recurrence}
          />
        ) : null}
        <DetailField
          label={t('common.status', {}, 'Status')}
          value={
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                pillClass,
              )}
            >
              {t(STATUS_LABEL_KEY[status], {}, status)}
            </span>
          }
        />
        {prompt ? (
          <DetailField
            label={t('scheduler.automations.prompt', {}, 'Prompt')}
            value={
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
                {prompt}
              </p>
            }
          />
        ) : null}
        {task.lastRunAt ? (
          <DetailField
            label={t('scheduler.automations.lastRun', {}, 'Last run')}
            value={formatDateTimeSimple(task.lastRunAt, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          />
        ) : null}
      </div>

      {/* Run history for recurring tasks */}
      {isRecurring ? (
        <AutomationRunHistory
          runs={runs}
          isLoading={runsQuery.isLoading}
          isError={runsQuery.isError}
          t={t}
        />
      ) : null}

      {/* Action buttons */}
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
// AutomationRunHistory — David's ActivationRunHistory adapted to ScheduledTaskRun
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
    <div className="mt-4 space-y-2">
      <div
        data-testid="run-history-header"
        className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60"
      >
        {t('scheduler.automations.runHistory', {}, 'Run history')}
      </div>

      <div className="rounded-card border border-border/60 bg-muted/10">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="px-3 py-4 text-[13px] text-muted-foreground/70">
            {t('scheduler.automations.runsLoadError', {}, 'Could not load run history.')}
          </p>
        ) : runs.length === 0 ? (
          <p className="px-3 py-4 text-[13px] text-muted-foreground/70">
            {t('scheduler.automations.runsEmpty', {}, 'No runs yet.')}
          </p>
        ) : (
          <div className="divide-y divide-border/50">
            {runs.map((run) => (
              <RunHistoryRow key={run.id} run={run} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RunHistoryRow
// ---------------------------------------------------------------------------

function RunHistoryRow({ run, t }: { run: ScheduledTaskRun; t: TFunction }) {
  const isFailed = run.status === 'failed' || run.status === 'dead_letter';

  const rowBody = (
    <>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground/90">
          {isFailed ? (
            <span
              className="inline-flex shrink-0 text-destructive"
              aria-label={t('scheduler.automations.runFailed', {}, 'Failed')}
            >
              <WarningIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          ) : null}
          <span data-testid="run-timestamp">
            {formatDateTimeSimple(run.finishedAt ?? run.scheduledFor, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>
      </div>
      {/* v3 has no standalone conversation deep-link route — render as plain text */}
      {run.conversationId ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-muted-foreground">
          <MessageSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {t('scheduler.automations.viewChat', {}, 'View chat')}
        </span>
      ) : null}
    </>
  );

  return (
    <div className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left">
      {rowBody}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DetailField
// ---------------------------------------------------------------------------

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </div>
      <div className="text-[13px] text-foreground/90">{value}</div>
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
