import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { createContactsClient } from './contactsClient';
import { contactsKeys } from './contactsKeys';
import type { ContactInput, ListContactsParams, ListContactsResult } from './types';

/** v1 fetches a single server page and filters client-side (see useListPageState).
 *  Documented limitation; server-side pagination is a follow-up. */
const LIST_PARAMS: ListContactsParams = { page: 1, pageSize: 100, sort: '-created_at' };

function useContactsClient() {
  return useMemo(() => createContactsClient({ baseUrl: resolveOsirisApiBaseUrl() }), []);
}

function useOrgId(): string | null {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

export function useContacts() {
  const client = useContactsClient();
  const org = useOrgId();
  return useQuery({
    queryKey: contactsKeys.list(org, LIST_PARAMS),
    queryFn: () => client.listContacts(LIST_PARAMS),
  });
}

export function useContact(id: string | null) {
  const client = useContactsClient();
  const org = useOrgId();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: contactsKeys.detail(org, id ?? ''),
    queryFn: () => client.getContact(id as string),
    enabled: Boolean(id),
    // Render instantly from the already-loaded list while the full record refetches.
    placeholderData: () => {
      if (!id) return undefined;
      const list = queryClient.getQueryData<ListContactsResult>(
        contactsKeys.list(org, LIST_PARAMS),
      );
      return list?.data.find((contact) => contact.id === id);
    },
  });
}

export function useContactCategories() {
  const client = useContactsClient();
  const org = useOrgId();
  return useQuery({
    queryKey: contactsKeys.categories(org),
    queryFn: () => client.listCategories(),
  });
}

export function useContactMutations() {
  const client = useContactsClient();
  const org = useOrgId();
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: contactsKeys.root(org) });
  };

  const createContact = useMutation({
    mutationFn: (input: ContactInput) => client.createContact(input),
    onSuccess: invalidate,
  });
  const updateContact = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ContactInput }) =>
      client.updateContact(id, input),
    onSuccess: invalidate,
  });
  const deleteContacts = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => client.deleteContact(id))).then(() => undefined),
    onSuccess: invalidate,
  });

  return { createContact, updateContact, deleteContacts };
}
