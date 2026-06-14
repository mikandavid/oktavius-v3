import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import {
  createOsirisWhatsAppClient,
  type OsirisWhatsAppAddContactInput,
  type OsirisWhatsAppConfigInput,
  type OsirisWhatsAppUpdateContactInput,
} from './whatsappClient';
import { whatsappKeys } from './whatsappKeys';

export function useWhatsAppClient() {
  return useMemo(() => createOsirisWhatsAppClient({ baseUrl: resolveOsirisApiBaseUrl() }), []);
}

function useOrgId() {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

export function useWhatsAppStatus() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  return useQuery({
    queryKey: whatsappKeys.status(orgId),
    queryFn: () => client.getStatus(),
    refetchInterval: 30_000,
  });
}

export function useWhatsAppConfig() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  return useQuery({
    queryKey: whatsappKeys.config(orgId),
    queryFn: () => client.getConfig(),
    enabled: Boolean(orgId),
  });
}

export function useUpdateWhatsAppConfig() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OsirisWhatsAppConfigInput) => client.updateConfig(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.config(orgId) });
    },
  });
}

export function useWhatsAppContacts() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  return useQuery({
    queryKey: whatsappKeys.contacts(orgId),
    queryFn: () => client.listContacts(),
    enabled: Boolean(orgId),
  });
}

export function useAddWhatsAppContact() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OsirisWhatsAppAddContactInput) => client.addContact(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.contacts(orgId) });
    },
  });
}

export function useUpdateWhatsAppContact() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & OsirisWhatsAppUpdateContactInput) =>
      client.updateContact(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.contacts(orgId) });
    },
  });
}

export function useDeleteWhatsAppContact() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.deleteContact(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.contacts(orgId) });
    },
  });
}

/** Org members for the "link user" dropdown. Empty when the runtime can't list members. */
export function useWhatsAppOrgMembers() {
  const runtime = useOptionalOsirisRuntime();
  const orgId = useOrgId();
  const listOrgMembers = runtime?.listOrgMembers;
  return useQuery({
    queryKey: whatsappKeys.members(orgId),
    queryFn: () => listOrgMembers!(orgId),
    enabled: Boolean(orgId) && Boolean(listOrgMembers),
  });
}
