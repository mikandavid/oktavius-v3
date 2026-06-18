/**
 * AutomationForm — prop-driven create/edit form for the agent-admin automations section.
 *
 * Ported from osiris_erp AutomationFormPage.tsx.
 * Router navigation (useNavigate, useParams) replaced by taskId/onDone/onCancel props.
 * Select → Combobox (from @oktavius/base-ui) for all dropdowns.
 * Toasts remain as appToast (already used in the hooks).
 */

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Combobox,
  type ComboboxOption,
  Input,
  Label,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@oktavius/base-ui';
import { useEffect, useMemo, useState } from 'react';

import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { BotIcon } from '@/lib/icons';
import {
  useCreateScheduledTask,
  useScheduledTask,
  useTriggerMailboxes,
  useUpdateScheduledTask,
} from '@/modules/agent-admin/data/useScheduler';
import type {
  CreateScheduledTaskPayload,
  EmailTriggerAttachmentType,
  ScheduledTask,
  TriggerConfig,
} from '@/runtime/osiris/schedulerClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Mode = 'schedule' | 'trigger';
type FormScheduleType = 'interval' | 'cron' | 'once';
type IntervalUnit = 'minutes' | 'hours' | 'days';
type TriggerKind = 'email_received' | 'halo_ticket_created';

const ATTACHMENT_TYPES: EmailTriggerAttachmentType[] = ['pdf', 'word', 'excel', 'image'];
const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

interface FormState {
  name: string;
  description: string;
  prompt: string;
  scope: 'user' | 'org';
  mode: Mode;
  scheduleType: FormScheduleType;
  intervalValue: string;
  intervalUnit: IntervalUnit;
  cronExpression: string;
  onceAt: string;
  timezone: string;
  triggerKind: TriggerKind;
  syncAccountId: string;
  senders: string;
  keywords: string;
  attachmentsMode: 'none' | 'any' | 'types';
  attachmentTypes: EmailTriggerAttachmentType[];
  priorityIds: string;
  statusIds: string;
  clientIds: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AutomationFormProps {
  /** null = create mode; string = edit mode */
  taskId: string | null;
  onDone: () => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultFormState(): FormState {
  return {
    name: '',
    description: '',
    prompt: '',
    scope: 'user',
    mode: 'schedule',
    scheduleType: 'cron',
    intervalValue: '1',
    intervalUnit: 'hours',
    cronExpression: '0 9 * * 1-5',
    onceAt: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    triggerKind: 'email_received',
    syncAccountId: '',
    senders: '',
    keywords: '',
    attachmentsMode: 'none',
    attachmentTypes: [],
    priorityIds: '',
    statusIds: '',
    clientIds: '',
  };
}

function splitList(value: string): string[] {
  return value
    .split(/[,\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitNumberList(value: string): number[] {
  return splitList(value)
    .map((item) => Number(item))
    .filter((num) => Number.isInteger(num) && num > 0);
}

function taskToFormState(task: ScheduledTask): FormState {
  const base = defaultFormState();
  const prompt =
    typeof task.targetPayload?.prompt === 'string' ? (task.targetPayload.prompt as string) : '';
  const state: FormState = {
    ...base,
    name: task.name,
    description: task.description ?? '',
    prompt,
    scope: task.scope === 'org' ? 'org' : 'user',
    timezone: task.timezone || base.timezone,
  };

  if (task.scheduleType === 'event') {
    state.mode = 'trigger';
    const config = task.triggerConfig;
    if (config?.kind === 'halo_ticket_created') {
      state.triggerKind = 'halo_ticket_created';
      state.priorityIds = (config.priorityIds ?? []).join(', ');
      state.statusIds = (config.statusIds ?? []).join(', ');
      state.clientIds = (config.clientIds ?? []).join(', ');
    } else if (config?.kind === 'email_received') {
      state.triggerKind = 'email_received';
      state.syncAccountId = config.syncAccountId ?? '';
      state.senders = (config.senders ?? []).join(', ');
      state.keywords = (config.keywords ?? []).join(', ');
      if (config.attachments === 'any') {
        state.attachmentsMode = 'any';
      } else if (Array.isArray(config.attachments) && config.attachments.length > 0) {
        state.attachmentsMode = 'types';
        state.attachmentTypes = config.attachments;
      }
    }
    return state;
  }

  state.mode = 'schedule';
  if (task.scheduleType === 'cron') {
    state.scheduleType = 'cron';
    state.cronExpression = task.scheduleExpression;
  } else if (task.scheduleType === 'interval') {
    state.scheduleType = 'interval';
    const ms = Number(task.scheduleExpression);
    if (Number.isFinite(ms) && ms > 0) {
      if (ms % MS_PER_DAY === 0) {
        state.intervalValue = String(ms / MS_PER_DAY);
        state.intervalUnit = 'days';
      } else if (ms % MS_PER_HOUR === 0) {
        state.intervalValue = String(ms / MS_PER_HOUR);
        state.intervalUnit = 'hours';
      } else {
        state.intervalValue = String(Math.max(1, Math.round(ms / MS_PER_MINUTE)));
        state.intervalUnit = 'minutes';
      }
    }
  } else if (task.scheduleType === 'once') {
    state.scheduleType = 'once';
    const date = new Date(task.scheduleExpression);
    if (!Number.isNaN(date.getTime())) {
      const pad = (num: number) => String(num).padStart(2, '0');
      state.onceAt = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
  }
  return state;
}

function buildPayload(state: FormState): CreateScheduledTaskPayload {
  const common = {
    scope: state.scope,
    name: state.name.trim(),
    description: state.description.trim() ? state.description.trim() : null,
    timezone: state.timezone.trim() || 'UTC',
    targetType: 'orchestration_event' as const,
    targetPayload: {
      eventType: 'agent_activation' as const,
      prompt: state.prompt.trim(),
    },
  };

  if (state.mode === 'trigger') {
    const triggerConfig: TriggerConfig =
      state.triggerKind === 'email_received'
        ? {
            kind: 'email_received',
            syncAccountId: state.syncAccountId,
            senders: splitList(state.senders),
            keywords: splitList(state.keywords),
            attachments:
              state.attachmentsMode === 'any'
                ? 'any'
                : state.attachmentsMode === 'types' && state.attachmentTypes.length > 0
                  ? state.attachmentTypes
                  : null,
          }
        : {
            kind: 'halo_ticket_created',
            priorityIds: splitNumberList(state.priorityIds),
            statusIds: splitNumberList(state.statusIds),
            clientIds: splitNumberList(state.clientIds),
          };
    return {
      ...common,
      scheduleType: 'event',
      scheduleExpression: triggerConfig.kind,
      triggerConfig,
    };
  }

  if (state.scheduleType === 'cron') {
    return { ...common, scheduleType: 'cron', scheduleExpression: state.cronExpression.trim() };
  }
  if (state.scheduleType === 'once') {
    return {
      ...common,
      scheduleType: 'once',
      scheduleExpression: new Date(state.onceAt).toISOString(),
    };
  }
  const value = Math.max(1, Number(state.intervalValue) || 1);
  const unitMs =
    state.intervalUnit === 'days'
      ? MS_PER_DAY
      : state.intervalUnit === 'hours'
        ? MS_PER_HOUR
        : MS_PER_MINUTE;
  return { ...common, scheduleType: 'interval', scheduleExpression: String(value * unitMs) };
}

// ---------------------------------------------------------------------------
// AutomationForm
// ---------------------------------------------------------------------------

export function AutomationForm({ taskId, onDone, onCancel }: AutomationFormProps) {
  const isEdit = taskId !== null;
  const { t } = useTranslation();
  const { ready } = usePreloadNamespaces(['scheduler', 'agent_admin']);

  const taskQuery = useScheduledTask(isEdit ? taskId : undefined);
  const mailboxesQuery = useTriggerMailboxes();
  const createMutation = useCreateScheduledTask();
  const updateMutation = useUpdateScheduledTask(isEdit ? taskId : undefined);

  const [state, setState] = useState<FormState>(defaultFormState);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && taskQuery.data && !hydrated) {
      setState(taskToFormState(taskQuery.data));
      setHydrated(true);
    }
  }, [isEdit, taskQuery.data, hydrated]);

  const mailboxes = useMemo(() => mailboxesQuery.data?.data ?? [], [mailboxesQuery.data]);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const patch = (changes: Partial<FormState>) => setState((prev) => ({ ...prev, ...changes }));

  // Combobox option builders
  const scopeOptions: ComboboxOption[] = [
    { value: 'user', label: t('scheduler.automations.form.scopeUser', {}, 'Personal') },
    { value: 'org', label: t('scheduler.automations.form.scopeOrg', {}, 'Organisation') },
  ];
  const scheduleTypeOptions: ComboboxOption[] = [
    { value: 'cron', label: t('scheduler.automations.form.scheduleCron', {}, 'Cron') },
    { value: 'interval', label: t('scheduler.automations.form.scheduleInterval', {}, 'Interval') },
    { value: 'once', label: t('scheduler.automations.form.scheduleOnce', {}, 'Once') },
  ];
  const intervalUnitOptions: ComboboxOption[] = [
    { value: 'minutes', label: t('scheduler.automations.form.unitMinutes', {}, 'minutes') },
    { value: 'hours', label: t('scheduler.automations.form.unitHours', {}, 'hours') },
    { value: 'days', label: t('scheduler.automations.form.unitDays', {}, 'days') },
  ];
  const triggerKindOptions: ComboboxOption[] = [
    {
      value: 'email_received',
      label: t('scheduler.automations.trigger.emailReceived', {}, 'Email received'),
    },
    {
      value: 'halo_ticket_created',
      label: t('scheduler.automations.trigger.haloTicketCreated', {}, 'Halo ticket created'),
    },
  ];
  const attachmentsModeOptions: ComboboxOption[] = [
    { value: 'none', label: t('scheduler.automations.form.attachmentsNone', {}, 'None') },
    { value: 'any', label: t('scheduler.automations.form.attachmentsAny', {}, 'Any') },
    {
      value: 'types',
      label: t('scheduler.automations.form.attachmentsTypes', {}, 'Specific types'),
    },
  ];
  const mailboxOptions: ComboboxOption[] = mailboxes.map((mailbox) => ({
    value: mailbox.id,
    label: mailbox.emailAddress ?? mailbox.displayName ?? mailbox.id,
  }));

  const validate = (): string | null => {
    if (!state.name.trim())
      return t('scheduler.automations.form.errors.nameRequired', {}, 'Name is required.');
    if (!state.prompt.trim())
      return t('scheduler.automations.form.errors.promptRequired', {}, 'Prompt is required.');
    if (
      state.mode === 'trigger' &&
      state.triggerKind === 'email_received' &&
      !state.syncAccountId
    ) {
      return t(
        'scheduler.automations.form.errors.mailboxRequired',
        {},
        'A mailbox is required for email triggers.',
      );
    }
    if (state.mode === 'schedule' && state.scheduleType === 'once') {
      const date = new Date(state.onceAt);
      if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
        return t(
          'scheduler.automations.form.errors.onceInFuture',
          {},
          'The run time must be in the future.',
        );
      }
    }
    if (
      state.mode === 'schedule' &&
      state.scheduleType === 'cron' &&
      !state.cronExpression.trim()
    ) {
      return t(
        'scheduler.automations.form.errors.cronRequired',
        {},
        'Cron expression is required.',
      );
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    try {
      const payload = buildPayload(state);
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      onDone();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t('scheduler.automations.form.errors.generic', {}, 'Something went wrong.'),
      );
    }
  };

  if (!ready || (isEdit && taskQuery.isLoading)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel} className="shrink-0">
          ← {t('scheduler.automations.backToList', {}, 'Back')}
        </Button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-muted/40 text-muted-foreground">
          <BotIcon />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight">
            {isEdit
              ? t('scheduler.automations.form.editTitle', {}, 'Edit automation')
              : t('scheduler.automations.form.createTitle', {}, 'New automation')}
          </h2>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {t(
              'scheduler.automations.form.subtitle',
              {},
              'Configure a scheduled or event-triggered automation.',
            )}
          </p>
        </div>
      </div>

      {/* Basics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('scheduler.automations.form.basics', {}, 'Basics')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="automation-name">
                {t('scheduler.automations.form.name', {}, 'Name')}
              </Label>
              <Input
                id="automation-name"
                value={state.name}
                maxLength={255}
                onChange={(event) => patch({ name: event.target.value })}
                placeholder={t('scheduler.automations.form.namePlaceholder', {}, 'My automation')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('scheduler.automations.form.scope', {}, 'Scope')}</Label>
              <Combobox
                value={state.scope}
                onChange={(value) => {
                  if (value === 'user' || value === 'org') patch({ scope: value });
                }}
                options={scopeOptions}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="automation-description">
              {t('scheduler.automations.form.description', {}, 'Description')}
            </Label>
            <Input
              id="automation-description"
              value={state.description}
              maxLength={2000}
              onChange={(event) => patch({ description: event.target.value })}
              placeholder={t(
                'scheduler.automations.form.descriptionPlaceholder',
                {},
                'Optional description',
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="automation-prompt">
              {t('scheduler.automations.form.prompt', {}, 'Prompt')}
            </Label>
            <Textarea
              id="automation-prompt"
              value={state.prompt}
              maxLength={2000}
              rows={4}
              onChange={(event) => patch({ prompt: event.target.value })}
              placeholder={t(
                'scheduler.automations.form.promptPlaceholder',
                {},
                'What should the agent do?',
              )}
            />
            <p className="text-xs text-muted-foreground">
              {t(
                'scheduler.automations.form.promptHint',
                {},
                'Instructions sent to the agent when the automation runs.',
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* When */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('scheduler.automations.form.when', {}, 'When')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('scheduler.automations.form.whenHint', {}, 'Choose when this automation runs.')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={state.mode} onValueChange={(value) => patch({ mode: value as Mode })}>
            <TabsList>
              <TabsTrigger value="schedule">
                {t('scheduler.automations.form.modeSchedule', {}, 'Schedule')}
              </TabsTrigger>
              <TabsTrigger value="trigger">
                {t('scheduler.automations.form.modeTrigger', {}, 'Event trigger')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {state.mode === 'schedule' ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('scheduler.automations.form.scheduleType', {}, 'Schedule type')}</Label>
                  <Combobox
                    value={state.scheduleType}
                    onChange={(value) => {
                      if (value) patch({ scheduleType: value as FormScheduleType });
                    }}
                    options={scheduleTypeOptions}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="automation-timezone">
                    {t('scheduler.automations.timezone', {}, 'Timezone')}
                  </Label>
                  <Input
                    id="automation-timezone"
                    value={state.timezone}
                    onChange={(event) => patch({ timezone: event.target.value })}
                  />
                </div>
              </div>

              {state.scheduleType === 'cron' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="automation-cron">
                    {t('scheduler.automations.form.cronExpression', {}, 'Cron expression')}
                  </Label>
                  <Input
                    id="automation-cron"
                    value={state.cronExpression}
                    onChange={(event) => patch({ cronExpression: event.target.value })}
                    placeholder="0 9 * * 1-5"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('scheduler.automations.form.cronHint', {}, 'Standard 5-field cron syntax.')}
                  </p>
                </div>
              ) : null}

              {state.scheduleType === 'interval' ? (
                <div className="flex items-end gap-3">
                  <div className="w-28 space-y-1.5">
                    <Label htmlFor="automation-interval">
                      {t('scheduler.automations.form.intervalEvery', {}, 'Every')}
                    </Label>
                    <Input
                      id="automation-interval"
                      type="number"
                      min={1}
                      value={state.intervalValue}
                      onChange={(event) => patch({ intervalValue: event.target.value })}
                    />
                  </div>
                  <Combobox
                    value={state.intervalUnit}
                    onChange={(value) => {
                      if (value) patch({ intervalUnit: value as IntervalUnit });
                    }}
                    options={intervalUnitOptions}
                    className="w-40"
                  />
                </div>
              ) : null}

              {state.scheduleType === 'once' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="automation-once">
                    {t('scheduler.automations.form.onceAt', {}, 'Run at')}
                  </Label>
                  <Input
                    id="automation-once"
                    type="datetime-local"
                    value={state.onceAt}
                    onChange={(event) => patch({ onceAt: event.target.value })}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t('scheduler.automations.form.triggerKind', {}, 'Trigger type')}</Label>
                <Combobox
                  value={state.triggerKind}
                  onChange={(value) => {
                    if (value) patch({ triggerKind: value as TriggerKind });
                  }}
                  options={triggerKindOptions}
                />
              </div>

              {state.triggerKind === 'email_received' ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>{t('scheduler.automations.form.mailbox', {}, 'Mailbox')}</Label>
                    <Combobox
                      value={state.syncAccountId || ''}
                      onChange={(value) => patch({ syncAccountId: value ?? '' })}
                      options={mailboxOptions}
                      placeholder={
                        mailboxesQuery.isLoading
                          ? t('common.loading', {}, 'Loading…')
                          : t(
                              'scheduler.automations.form.mailboxPlaceholder',
                              {},
                              'Select a mailbox',
                            )
                      }
                    />
                    {!mailboxesQuery.isLoading && mailboxes.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {t('scheduler.automations.form.noMailboxes', {}, 'No mailboxes available.')}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="trigger-senders">
                      {t('scheduler.automations.form.senders', {}, 'Senders')}
                    </Label>
                    <Input
                      id="trigger-senders"
                      value={state.senders}
                      onChange={(event) => patch({ senders: event.target.value })}
                      placeholder="martina@nordwind.example, @apexdental.example"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t(
                        'scheduler.automations.form.sendersHint',
                        {},
                        'Comma-separated email addresses or domains.',
                      )}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="trigger-keywords">
                      {t('scheduler.automations.form.keywords', {}, 'Keywords')}
                    </Label>
                    <Input
                      id="trigger-keywords"
                      value={state.keywords}
                      onChange={(event) => patch({ keywords: event.target.value })}
                      placeholder={t(
                        'scheduler.automations.form.keywordsPlaceholder',
                        {},
                        'invoice, urgent',
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t(
                        'scheduler.automations.form.keywordsHint',
                        {},
                        'Comma-separated keywords matched against subject and body.',
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('scheduler.automations.form.attachments', {}, 'Attachments')}</Label>
                    <Combobox
                      value={state.attachmentsMode}
                      onChange={(value) => {
                        if (value)
                          patch({ attachmentsMode: value as FormState['attachmentsMode'] });
                      }}
                      options={attachmentsModeOptions}
                    />
                    {state.attachmentsMode === 'types' ? (
                      <div className="flex flex-wrap gap-4 pt-1">
                        {ATTACHMENT_TYPES.map((type) => (
                          <label key={type} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={state.attachmentTypes.includes(type)}
                              onCheckedChange={(checked) =>
                                patch({
                                  attachmentTypes: checked
                                    ? [...state.attachmentTypes, type]
                                    : state.attachmentTypes.filter((item) => item !== type),
                                })
                              }
                            />
                            {t(`scheduler.automations.trigger.attachmentType.${type}`, {}, type)}
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="trigger-priorities">
                      {t('scheduler.automations.form.haloPriorities', {}, 'Priority IDs')}
                    </Label>
                    <Input
                      id="trigger-priorities"
                      value={state.priorityIds}
                      onChange={(event) => patch({ priorityIds: event.target.value })}
                      placeholder="1, 2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="trigger-statuses">
                      {t('scheduler.automations.form.haloStatuses', {}, 'Status IDs')}
                    </Label>
                    <Input
                      id="trigger-statuses"
                      value={state.statusIds}
                      onChange={(event) => patch({ statusIds: event.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="trigger-clients">
                      {t('scheduler.automations.form.haloClients', {}, 'Client IDs')}
                    </Label>
                    <Input
                      id="trigger-clients"
                      value={state.clientIds}
                      onChange={(event) => patch({ clientIds: event.target.value })}
                      placeholder="12"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground sm:col-span-3">
                    {t(
                      'scheduler.automations.form.haloHint',
                      {},
                      'Leave blank to match any value.',
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center gap-2">
        <Button disabled={isPending} onClick={() => void handleSubmit()}>
          {isEdit
            ? t('common.save', {}, 'Save')
            : t('scheduler.automations.form.create', {}, 'Create')}
        </Button>
        <Button variant="outline" disabled={isPending} onClick={onCancel}>
          {t('common.cancel', {}, 'Cancel')}
        </Button>
      </div>
    </div>
  );
}
