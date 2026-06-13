import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { createOsirisStorageClient } from './storageClient';
import { storageKeys } from './storageKeys';
import type { ListNodesParams } from './types';

export function useStorageClient() {
  return useMemo(() => createOsirisStorageClient({ baseUrl: resolveOsirisApiBaseUrl() }), []);
}

function useOrgId() {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

export function useStorageTree() {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({ queryKey: storageKeys.tree(org), queryFn: () => client.listTree() });
}

export function useStorageNodes(params: ListNodesParams, enabled = true) {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({
    queryKey: storageKeys.nodes(org, params),
    queryFn: () => client.listNodes(params),
    enabled,
  });
}

export function useFavorites(enabled: boolean) {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({
    queryKey: storageKeys.favorites(org),
    queryFn: () => client.listFavorites(),
    enabled,
  });
}

export function useRecent(enabled: boolean) {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({
    queryKey: storageKeys.recent(org),
    queryFn: () => client.listRecent(),
    enabled,
  });
}

export function useTrash(page: number, enabled: boolean) {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({
    queryKey: storageKeys.trash(org, page),
    queryFn: () => client.listTrash({ page }),
    enabled,
  });
}

export function useStorageUsage() {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({ queryKey: storageKeys.usage(org), queryFn: () => client.usage() });
}

export function useFilePreviewUrl(id: string | null) {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({
    queryKey: storageKeys.previewUrl(org, id ?? ''),
    queryFn: () => client.previewUrl(id as string),
    enabled: Boolean(id),
    staleTime: 9 * 60 * 1000,
  });
}

export function useInvalidateStorage() {
  const queryClient = useQueryClient();
  const org = useOrgId();
  return () => {
    void queryClient.invalidateQueries({ queryKey: storageKeys.root(org) });
  };
}

export function useStorageMutations() {
  const client = useStorageClient();
  const invalidate = useInvalidateStorage();

  const createFolder = useMutation({
    mutationFn: (input: { name: string; parentId: string | null }) => client.createFolder(input),
    onSuccess: invalidate,
  });
  const rename = useMutation({
    mutationFn: (input: { id: string; name: string }) => client.rename(input.id, input.name),
    onSuccess: invalidate,
  });
  const move = useMutation({
    mutationFn: (input: { nodeIds: string[]; targetFolderId: string | null }) =>
      client.move(input.nodeIds, input.targetFolderId),
    onSuccess: invalidate,
  });
  const trash = useMutation({
    mutationFn: (nodeIds: string[]) => client.trash(nodeIds),
    onSuccess: invalidate,
  });
  const restore = useMutation({
    mutationFn: (id: string) => client.restore(id),
    onSuccess: invalidate,
  });
  const purge = useMutation({
    mutationFn: (nodeIds: string[]) => client.purge(nodeIds),
    onSuccess: invalidate,
  });
  const toggleFavorite = useMutation({
    mutationFn: (input: { id: string; starred: boolean }) =>
      input.starred ? client.removeFavorite(input.id) : client.addFavorite(input.id),
    onSuccess: invalidate,
  });

  return { createFolder, rename, move, trash, restore, purge, toggleFavorite };
}
