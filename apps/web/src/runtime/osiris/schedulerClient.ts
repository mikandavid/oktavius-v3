import { joinOsirisApiBaseUrl } from './apiBaseUrl';
import { readErrorMessage } from './osirisClientUtils';

export type ScheduleType = 'once' | 'interval' | 'cron' | 'event';
export type ScheduledTaskRunStatus =
  | 'claimed'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'dead_letter';
export type EmailTriggerAttachmentType = 'pdf' | 'word' | 'excel' | 'image';

export interface EmailTriggerConfig {
  kind: 'email_received';
  syncAccountId: string;
  senders: string[];
  keywords: string[];
  attachments: 'any' | EmailTriggerAttachmentType[] | null;
  rateLimitPerHour?: number;
}
export interface HaloTriggerConfig {
  kind: 'halo_ticket_created';
  priorityIds: number[];
  statusIds: number[];
  clientIds: number[];
  rateLimitPerHour?: number;
}
export type TriggerConfig = EmailTriggerConfig | HaloTriggerConfig;

export interface ScheduledTask {
  id: string;
  scope: 'org' | 'user' | 'system';
  ownerUserId: string | null;
  name: string;
  description: string | null;
  enabled: boolean;
  scheduleType: ScheduleType;
  scheduleExpression: string;
  timezone: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  targetType: string;
  targetPayload: Record<string, unknown>;
  triggerConfig: TriggerConfig | null;
  createdAt: string;
  updatedAt: string;
}
export interface TriggerMailbox {
  id: string;
  userId: string;
  emailAddress: string | null;
  displayName: string | null;
  syncStatus: string | null;
}
export interface CreateScheduledTaskPayload {
  scope?: 'org' | 'user';
  name: string;
  description?: string | null;
  scheduleType: ScheduleType;
  scheduleExpression: string;
  timezone?: string;
  targetType: 'orchestration_event';
  targetPayload: { eventType: 'agent_activation'; prompt: string };
  triggerConfig?: TriggerConfig | null;
}
export interface RunTriggerContext {
  kind?: string;
  from?: string | null;
  subject?: string | null;
  mailbox?: string | null;
  ticketId?: number | null;
  summary?: string | null;
  clientName?: string | null;
}
export interface ScheduledTaskRun {
  id: string;
  taskId: string;
  scheduledFor: string;
  startedAt: string | null;
  finishedAt: string | null;
  status: ScheduledTaskRunStatus;
  attemptCount: number;
  targetRef: string | null;
  conversationId: string | null;
  userError: string | null;
  metadata?: { trigger?: RunTriggerContext } & Record<string, unknown>;
  createdAt: string;
}
export interface SchedulerPageResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore?: boolean;
}

export type OsirisSchedulerClientOptions = { baseUrl?: string };

export function createOsirisSchedulerClient(options: OsirisSchedulerClientOptions = {}) {
  const url = (path: string) => joinOsirisApiBaseUrl(options.baseUrl, path);
  async function getJson(path: string, fallback: string): Promise<unknown> {
    const response = await fetch(url(path), { credentials: 'include' });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    return response.json();
  }
  async function send(path: string, method: string, body: unknown, fallback: string) {
    const response = await fetch(url(path), {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    listTasks: () =>
      getJson('/scheduler?page=1&pageSize=100', 'Automations could not be loaded.') as Promise<
        SchedulerPageResult<ScheduledTask>
      >,
    getTask: (taskId: string) =>
      getJson(
        `/scheduler/${encodeURIComponent(taskId)}`,
        'Automation could not be loaded.',
      ) as Promise<ScheduledTask>,
    listTaskRuns: (taskId: string, pageSize = 50) =>
      getJson(
        `/scheduler/runs?taskId=${encodeURIComponent(taskId)}&page=1&pageSize=${pageSize}`,
        'Run history could not be loaded.',
      ) as Promise<SchedulerPageResult<ScheduledTaskRun>>,
    triggerMailboxes: () =>
      getJson('/scheduler/trigger-mailboxes', 'Mailboxes could not be loaded.') as Promise<{
        data: TriggerMailbox[];
      }>,
    createTask: (payload: CreateScheduledTaskPayload) =>
      send(
        '/scheduler',
        'POST',
        payload,
        'Automation could not be created.',
      ) as Promise<ScheduledTask>,
    updateTask: (taskId: string, payload: Partial<CreateScheduledTaskPayload>) =>
      send(
        `/scheduler/${encodeURIComponent(taskId)}`,
        'PATCH',
        payload,
        'Automation could not be updated.',
      ) as Promise<ScheduledTask>,
    pauseTask: (taskId: string) =>
      send(
        `/scheduler/${encodeURIComponent(taskId)}/pause`,
        'POST',
        undefined,
        'Could not pause.',
      ) as Promise<ScheduledTask>,
    resumeTask: (taskId: string) =>
      send(
        `/scheduler/${encodeURIComponent(taskId)}/resume`,
        'POST',
        undefined,
        'Could not resume.',
      ) as Promise<ScheduledTask>,
    runTaskNow: (taskId: string) =>
      send(
        `/scheduler/${encodeURIComponent(taskId)}/run-now`,
        'POST',
        undefined,
        'Could not run now.',
      ) as Promise<unknown>,
  };
}
