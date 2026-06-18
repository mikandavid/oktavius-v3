import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { appToast } from '@/lib/toast';
import {
  type AgentIntegrationKey,
  type ConnectAgentIntegrationInput,
  type CreateConnectionInput,
  createOsirisAgentIntegrationsClient,
  type IntegrationConnection,
} from '@/runtime/osiris/agentIntegrationsClient';
import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { agentAdminKeys } from './agentAdminKeys';

function useClient() {
  return useMemo(
    () => createOsirisAgentIntegrationsClient({ baseUrl: resolveOsirisApiBaseUrl() }),
    [],
  );
}

function useOrgId() {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

export function useIntegrationConnections() {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.connections(org),
    queryFn: () => client.listConnections(),
  });
}

export function useNativeIntegrations(enabled = true) {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.nativeIntegrations(org),
    queryFn: () => client.listNativeIntegrations(),
    enabled,
  });
}

export function useProviderDiagnostics() {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.providerDiagnostics(org),
    queryFn: () => client.providerDiagnostics(),
  });
}

export function useSearchIntegrationApps(query: string, enabled: boolean) {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.appSearch(org, query),
    queryFn: () => client.searchApps(query),
    enabled: enabled && query.trim().length > 0,
  });
}

function useInvalidateIntegrations() {
  const queryClient = useQueryClient();
  const org = useOrgId();
  return () => {
    void queryClient.invalidateQueries({ queryKey: agentAdminKeys.connections(org) });
    void queryClient.invalidateQueries({ queryKey: agentAdminKeys.nativeIntegrations(org) });
  };
}

export function useCreateIntegrationConnection() {
  const client = useClient();
  return useMutation({
    mutationFn: (input: CreateConnectionInput) => client.createConnection(input),
    onError: (error) => appToast.fromApiError(error, 'Could not start the connection.'),
  });
}

export function useFinalizeIntegrationConnection() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (input: { attemptToken: string; accountId: string }) =>
      client.finalizeConnection(input),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not finalize the connection.'),
  });
}

export function useUpdateIntegrationConnection() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (input: {
      connectionId: string;
      data: Partial<
        Pick<IntegrationConnection, 'displayName' | 'visibility' | 'permissionMode' | 'grants'>
      >;
    }) => client.updateConnection(input.connectionId, input.data),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not update the connection.'),
  });
}

export function useDisconnectIntegrationConnection() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (connectionId: string) => client.disconnectConnection(connectionId),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not disconnect.'),
  });
}

export function useCheckIntegrationConnectionHealth() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (connectionId: string) => client.checkConnectionHealth(connectionId),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Health check failed.'),
  });
}

export function useReconnectIntegrationConnection() {
  const client = useClient();
  return useMutation({
    mutationFn: (connectionId: string) => client.reconnectConnection(connectionId),
    onError: (error) => appToast.fromApiError(error, 'Could not reconnect.'),
  });
}

export function useConnectNativeIntegration() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (input: { key: AgentIntegrationKey; data: ConnectAgentIntegrationInput }) =>
      client.connectNative(input.key, input.data),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not connect the integration.'),
  });
}

export function useTestNativeIntegration() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (key: AgentIntegrationKey) => client.testNative(key),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Integration test failed.'),
  });
}

export function useDisconnectNativeIntegration() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (key: AgentIntegrationKey) => client.disconnectNative(key),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not disconnect the integration.'),
  });
}
