/**
 * AutomationDetail — prop-driven detail component for the agent-admin automations section.
 *
 * Ported from osiris_erp AutomationDetailPage.tsx.
 * Router navigation (useNavigate, useParams) replaced by taskId/onBack/onEdit props.
 * ConfirmActionDialog used for run-now / pause / resume confirmations (no window.confirm).
 *
 * Chat links: v3 has no standalone conversation deep-link route for scheduled agent runs.
 * Where osiris would open a conversation, we render the conversationId as plain text.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@oktavius/base-ui';
import { useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { BotIcon, MessageSquareIcon, TimeIcon } from '@/lib/icons';
import {
  useScheduledTask,
  useScheduledTaskRuns,
  useTaskActions,
} from '@/modules/agent-admin/data/useScheduler';
import type { ScheduledTaskRun } from '@/runtime/osiris/schedulerClient';

import {
  deriveAutomationStatus,
  describeRunTrigger,
  describeSchedule,
  describeTriggerFilters,
  formatDateTimeSimple,
  RUN_STATUS_KEY,
  RUN_STATUS_VARIANT,
  TASK_STATUS_VARIANT,
} from './automationPresentation';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AutomationDetailProps {
  taskId: string;
  onBack: () => void;
  onEdit: (taskId: string) => void;
}

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
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← {t('scheduler.automations.backToList', {}, 'Back to automations')}
        </Button>
        <div className="py-16 text-center text-sm text-muted-foreground">
          {t('scheduler.automations.notFoundHint', {}, 'This automation could not be found.')}
        </div>
      </div>
    );
  }

  const statusVariant = TASK_STATUS_VARIANT[deriveAutomationStatus(task)];

  return (
    <div className="space-y-5" data-testid="automation-detail">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
            ← {t('scheduler.automations.backToList', {}, 'Back')}
          </Button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-muted/40 text-muted-foreground">
            <BotIcon />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight">{task.name}</h2>
            {task.description ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{task.description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={statusVariant}>
            {t(`scheduler.automations.status.${deriveAutomationStatus(task)}`)}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => onEdit(task.id)}>
            {t('common.edit', {}, 'Edit')}
          </Button>
          {task.enabled ? (
            <Button
              variant="outline"
              size="sm"
              disabled={pause.isPending}
              onClick={() => setConfirmPauseOpen(true)}
            >
              {t('scheduler.automations.pause', {}, 'Pause')}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={resume.isPending}
              onClick={() => setConfirmResumeOpen(true)}
            >
              {t('scheduler.automations.resume', {}, 'Resume')}
            </Button>
          )}
          <Button size="sm" disabled={runNow.isPending} onClick={() => setConfirmRunNowOpen(true)}>
            {t('scheduler.automations.runNow', {}, 'Run now')}
          </Button>
        </div>
      </div>

      {/* Details card */}
      <Card>
        <CardContent className="pt-6">
          <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('scheduler.automations.scheduleLabel', {}, 'Schedule')}
              </dt>
              <dd className="mt-1 flex items-center gap-1.5">
                <TimeIcon
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                {describeSchedule(task, t, formatDateTimeSimple)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('scheduler.automations.nextRun', {}, 'Next run')}
              </dt>
              <dd className="mt-1">
                {task.nextRunAt
                  ? formatDateTimeSimple(task.nextRunAt, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('scheduler.automations.lastRun', {}, 'Last run')}
              </dt>
              <dd className="mt-1">
                {task.lastRunAt
                  ? formatDateTimeSimple(task.lastRunAt, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : t('scheduler.automations.noRunsYet', {}, 'No runs yet')}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('scheduler.automations.timezone', {}, 'Timezone')}
              </dt>
              <dd className="mt-1">{task.timezone}</dd>
            </div>
            {task.scheduleType === 'event' ? (
              <div className="sm:col-span-2 lg:col-span-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('scheduler.automations.trigger.filtersLabel', {}, 'Trigger filters')}
                </dt>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {describeTriggerFilters(task.triggerConfig, t).join(' · ')}
                </dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      {/* Run history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('scheduler.automations.runHistory', {}, 'Run history')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t(
              'scheduler.automations.runHistoryDescription',
              {},
              'Recent executions of this automation.',
            )}
          </p>
        </CardHeader>
        <CardContent>
          {runsQuery.isLoading ? (
            <RunsTableSkeleton />
          ) : runsQuery.isError ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t('scheduler.automations.runsLoadError', {}, 'Could not load run history.')}
            </div>
          ) : runs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <TimeIcon className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p className="text-sm">{t('scheduler.automations.runsEmpty', {}, 'No runs yet.')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t('scheduler.automations.runColumns.started', {}, 'Started')}
                  </TableHead>
                  <TableHead>
                    {t('scheduler.automations.runColumns.finished', {}, 'Finished')}
                  </TableHead>
                  <TableHead>
                    {t('scheduler.automations.runColumns.status', {}, 'Status')}
                  </TableHead>
                  <TableHead>
                    {t('scheduler.automations.runColumns.details', {}, 'Details')}
                  </TableHead>
                  <TableHead className="w-px" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <RunRow key={run.id} run={run} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmations */}
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
// RunRow
// ---------------------------------------------------------------------------

function RunRow({ run }: { run: ScheduledTaskRun }) {
  const { t } = useTranslation();

  const started = run.startedAt ?? run.scheduledFor;
  const variant = RUN_STATUS_VARIANT[run.status] ?? 'secondary';
  const key = RUN_STATUS_KEY[run.status];

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-sm">
        {formatDateTimeSimple(started, { dateStyle: 'medium', timeStyle: 'short' })}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {run.finishedAt
          ? formatDateTimeSimple(run.finishedAt, { dateStyle: 'medium', timeStyle: 'short' })
          : '—'}
      </TableCell>
      <TableCell>
        <Badge variant={variant}>
          {key ? t(`scheduler.automations.runStatus.${key}`) : t('common.unknown', {}, 'Unknown')}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[360px]">
        {run.userError ? (
          <p className="line-clamp-2 text-xs text-destructive" title={run.userError}>
            {run.userError}
          </p>
        ) : describeRunTrigger(run.metadata?.trigger) ? (
          <p
            className="line-clamp-2 text-xs text-muted-foreground"
            title={describeRunTrigger(run.metadata?.trigger) ?? undefined}
          >
            {describeRunTrigger(run.metadata?.trigger)}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {/* v3 has no standalone conversation deep-link route yet; render conversationId as text only */}
        {run.conversationId ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {run.conversationId}
          </span>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function RunsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}
