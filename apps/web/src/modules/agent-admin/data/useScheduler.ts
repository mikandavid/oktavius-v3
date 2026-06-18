import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { appToast } from '@/lib/toast';
import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import {
  createOsirisSchedulerClient,
  type CreateScheduledTaskPayload,
} from '@/runtime/osiris/schedulerClient';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { agentAdminKeys } from './agentAdminKeys';

function useClient() {
  return useMemo(() => createOsirisSchedulerClient({ baseUrl: resolveOsirisApiBaseUrl() }), []);
}

function useOrgId() {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

export function useScheduledTasks() {
  const client = useClient();
  const org = useOrgId();
  return useQuery({ queryKey: agentAdminKeys.tasks(org), queryFn: () => client.listTasks() });
}

export function useScheduledTask(taskId: string | undefined) {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.task(org, taskId ?? ''),
    queryFn: () => client.getTask(taskId as string),
    enabled: Boolean(taskId),
  });
}

export function useScheduledTaskRuns(taskId: string | undefined, pageSize = 50) {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.taskRuns(org, taskId ?? ''),
    queryFn: () => client.listTaskRuns(taskId as string, pageSize),
    enabled: Boolean(taskId),
  });
}

export function useTriggerMailboxes(enabled = true) {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.triggerMailboxes(org),
    queryFn: () => client.triggerMailboxes(),
    enabled,
  });
}

function useInvalidateTasks() {
  const queryClient = useQueryClient();
  const org = useOrgId();
  return (taskId?: string) => {
    void queryClient.invalidateQueries({ queryKey: agentAdminKeys.tasks(org) });
    if (taskId) {
      void queryClient.invalidateQueries({ queryKey: agentAdminKeys.task(org, taskId) });
      void queryClient.invalidateQueries({ queryKey: agentAdminKeys.taskRuns(org, taskId) });
    }
  };
}

export function useCreateScheduledTask() {
  const client = useClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (payload: CreateScheduledTaskPayload) => client.createTask(payload),
    onSuccess: () => invalidate(),
    onError: (error) => appToast.fromApiError(error, 'Automation could not be created.'),
  });
}

export function useUpdateScheduledTask(taskId: string | undefined) {
  const client = useClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (payload: Partial<CreateScheduledTaskPayload>) =>
      client.updateTask(taskId as string, payload),
    onSuccess: () => invalidate(taskId),
    onError: (error) => appToast.fromApiError(error, 'Automation could not be updated.'),
  });
}

export function useTaskActions(taskId: string | undefined) {
  const client = useClient();
  const invalidate = useInvalidateTasks();
  const pause = useMutation({
    mutationFn: () => client.pauseTask(taskId as string),
    onSuccess: () => invalidate(taskId),
    onError: (error) => appToast.fromApiError(error, 'Could not pause the automation.'),
  });
  const resume = useMutation({
    mutationFn: () => client.resumeTask(taskId as string),
    onSuccess: () => invalidate(taskId),
    onError: (error) => appToast.fromApiError(error, 'Could not resume the automation.'),
  });
  const runNow = useMutation({
    mutationFn: () => client.runTaskNow(taskId as string),
    onSuccess: () => invalidate(taskId),
    onError: (error) => appToast.fromApiError(error, 'Could not run the automation now.'),
  });
  return { pause, resume, runNow };
}
