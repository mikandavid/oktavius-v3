import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApiRegistry } from '@/api/ApiProvider';
import type { ClientsListParams } from '@/api/demo-client';
import { toast } from '@/lib/toast';

export function useClientsList(params: ClientsListParams) {
  const registry = useApiRegistry();

  return useQuery({
    queryKey: ['clients', 'list', params],
    queryFn: () => registry.clients.list(params),
    staleTime: 0,
  });
}

export function useClientDetail(clientId: string | undefined) {
  const registry = useApiRegistry();

  return useQuery({
    queryKey: ['clients', 'detail', clientId],
    queryFn: () => registry.clients.get(clientId!),
    enabled: Boolean(clientId),
    staleTime: 0,
  });
}

export function useDeleteClient() {
  const registry = useApiRegistry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => registry.clients.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted.');
    },
    onError: () => {
      toast.error('Failed to delete client.');
    },
  });
}
