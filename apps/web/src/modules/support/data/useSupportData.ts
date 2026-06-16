import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { createSupportClient } from './supportClient';
import { supportKeys } from './supportKeys';
import type { CreateTicketInput, ListTicketsParams, SupportPriority, SupportStatus } from './types';

export function useSupportClient() {
  return useMemo(() => createSupportClient({ baseUrl: resolveOsirisApiBaseUrl() }), []);
}

function useOrgId() {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

export function useSupportTickets(params: ListTicketsParams) {
  const client = useSupportClient();
  const org = useOrgId();
  return useQuery({
    queryKey: supportKeys.list(org, params),
    queryFn: () => client.listTickets(params),
  });
}

export function useSupportStats(enabled = true) {
  const client = useSupportClient();
  const org = useOrgId();
  return useQuery({ queryKey: supportKeys.stats(org), queryFn: () => client.getStats(), enabled });
}

export function useSupportTicket(id: string | null) {
  const client = useSupportClient();
  const org = useOrgId();
  return useQuery({
    queryKey: supportKeys.ticket(org, id ?? ''),
    queryFn: () => client.getTicket(id as string),
    enabled: Boolean(id),
  });
}

export function useSupportComments(id: string | null) {
  const client = useSupportClient();
  const org = useOrgId();
  return useQuery({
    queryKey: supportKeys.comments(org, id ?? ''),
    queryFn: () => client.listComments(id as string),
    enabled: Boolean(id),
  });
}

export function useSupportAttachments(id: string | null) {
  const client = useSupportClient();
  const org = useOrgId();
  return useQuery({
    queryKey: supportKeys.attachments(org, id ?? ''),
    queryFn: () => client.listAttachments(id as string),
    enabled: Boolean(id),
  });
}

export function useSupportAssignees(enabled = true) {
  const client = useSupportClient();
  const org = useOrgId();
  return useQuery({
    queryKey: supportKeys.assignees(org),
    queryFn: () => client.listAssignees(),
    enabled,
  });
}

export function useSupportMutations() {
  const client = useSupportClient();
  const org = useOrgId();
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: supportKeys.root(org) });
  };

  const createTicket = useMutation({
    mutationFn: (input: CreateTicketInput) => client.createTicket(input),
    onSuccess: invalidate,
  });
  const uploadAttachments = useMutation({
    mutationFn: (input: { ticketId: string; files: File[] }) =>
      client.uploadAttachments(input.ticketId, input.files),
    onSuccess: invalidate,
  });
  const addComment = useMutation({
    mutationFn: (input: { ticketId: string; message: string; isInternal?: boolean }) =>
      client.addComment(input.ticketId, input.message, input.isInternal ?? false),
    onSuccess: invalidate,
  });
  const updateStatus = useMutation({
    mutationFn: (input: { ticketId: string; status: SupportStatus }) =>
      client.updateStatus(input.ticketId, input.status),
    onSuccess: invalidate,
  });
  const updatePriority = useMutation({
    mutationFn: (input: { ticketId: string; priority: SupportPriority }) =>
      client.updatePriority(input.ticketId, input.priority),
    onSuccess: invalidate,
  });
  const assign = useMutation({
    mutationFn: (input: { ticketId: string; assigneeUserId: string | null }) =>
      client.assign(input.ticketId, input.assigneeUserId),
    onSuccess: invalidate,
  });
  const resolve = useMutation({
    mutationFn: (input: { ticketId: string; resolutionMessage: string }) =>
      client.resolve(input.ticketId, input.resolutionMessage),
    onSuccess: invalidate,
  });

  return {
    createTicket,
    uploadAttachments,
    addComment,
    updateStatus,
    updatePriority,
    assign,
    resolve,
  };
}
