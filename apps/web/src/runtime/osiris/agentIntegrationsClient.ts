import { joinOsirisApiBaseUrl } from './apiBaseUrl';
import { readErrorMessage } from './osirisClientUtils';

export type AgentIntegrationKey = 'onoffice' | 'halo';
export type AgentIntegrationPermissionMode = 'read' | 'full';
export type AgentIntegrationConnectionStatus = 'not_connected' | 'connected' | 'error';

export interface AgentIntegrationSummary {
  key: AgentIntegrationKey;
  name: string;
  description: string;
  provider: string;
  docsUrl: string | null;
  capabilities: Record<string, unknown>;
  enabled: boolean;
  connectionStatus: AgentIntegrationConnectionStatus;
  permissionMode: AgentIntegrationPermissionMode;
  hasCredentials: boolean;
  baseUrl: string | null;
  lastTestedAt: string | null;
  lastError: string | null;
  connectedAt: string | null;
  updatedAt: string | null;
}

export interface ConnectAgentIntegrationInput {
  apiToken?: string;
  apiSecret?: string;
  permissionMode?: AgentIntegrationPermissionMode;
  baseUrl?: string | null;
  authorizationServer?: string;
  tenant?: string | null;
}

export type IntegrationConnectionStatus =
  | 'connecting'
  | 'syncing'
  | 'connected'
  | 'unhealthy'
  | 'reconnect_required'
  | 'disconnect_pending'
  | 'disconnected';

export interface IntegrationGrant {
  subjectType: 'all_members' | 'role' | 'custom_role' | 'user';
  subjectKey: string;
}

export interface IntegrationConnection {
  id: string;
  provider: 'pipedream' | 'onoffice' | 'halo';
  appKey: string;
  handle: string;
  displayName: string;
  ownerUserId: string | null;
  visibility: 'private' | 'shared';
  permissionMode: AgentIntegrationPermissionMode;
  status: IntegrationConnectionStatus;
  health: Record<string, unknown>;
  isOwner: boolean;
  canManage: boolean;
  grants: IntegrationGrant[];
  connectedAt: string | null;
  updatedAt: string;
}

export interface PipedreamApp {
  nameSlug: string;
  name: string;
  description?: string;
  imgSrc?: string;
  oauthAppId?: string;
}

export interface CreateConnectionInput {
  provider: 'pipedream';
  appKey: string;
  displayName: string;
  visibility: 'private' | 'shared';
  permissionMode: AgentIntegrationPermissionMode;
  grants: IntegrationGrant[];
}

export interface CreateConnectionResult {
  attemptToken: string;
  connectToken: string;
  externalUserId: string;
  expiresAt: string;
  oauthAppId?: string;
  projectEnvironment: 'development' | 'production';
}

export interface ReconnectResult extends CreateConnectionResult {
  providerAccountId: string;
  appKey: string;
}

export type OsirisAgentIntegrationsClientOptions = { baseUrl?: string };

export function createOsirisAgentIntegrationsClient(
  options: OsirisAgentIntegrationsClientOptions = {},
) {
  const url = (path: string) => joinOsirisApiBaseUrl(options.baseUrl, path);

  async function getJson(path: string, fallback: string): Promise<unknown> {
    const response = await fetch(url(path), { credentials: 'include' });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    return response.json();
  }

  async function send(
    path: string,
    method: string,
    body: unknown,
    fallback: string,
  ): Promise<unknown> {
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
    providerDiagnostics: () =>
      getJson('/agent-integrations/provider-diagnostics', 'Diagnostics unavailable.') as Promise<{
        pipedream: {
          enabled: boolean;
          configured: boolean;
          environment: string | null;
          projectId: string | null;
        };
      }>,
    listConnections: () =>
      getJson('/agent-integrations/connections', 'Connections could not be loaded.') as Promise<{
        connections: IntegrationConnection[];
      }>,
    searchApps: (query: string) =>
      getJson(
        `/agent-integrations/apps?q=${encodeURIComponent(query)}`,
        'App search failed.',
      ) as Promise<{ apps: PipedreamApp[] }>,
    createConnection: (input: CreateConnectionInput) =>
      send(
        '/agent-integrations/connections',
        'POST',
        input,
        'Connection failed.',
      ) as Promise<CreateConnectionResult>,
    finalizeConnection: (input: { attemptToken: string; accountId: string }) =>
      send(
        '/agent-integrations/connections/finalize',
        'POST',
        input,
        'Finalize failed.',
      ) as Promise<{ connection: IntegrationConnection }>,
    updateConnection: (
      connectionId: string,
      data: Partial<
        Pick<IntegrationConnection, 'displayName' | 'visibility' | 'permissionMode' | 'grants'>
      >,
    ) =>
      send(
        `/agent-integrations/connections/${encodeURIComponent(connectionId)}`,
        'PATCH',
        data,
        'Update failed.',
      ) as Promise<{ connection: IntegrationConnection }>,
    disconnectConnection: (connectionId: string) =>
      send(
        `/agent-integrations/connections/${encodeURIComponent(connectionId)}`,
        'DELETE',
        undefined,
        'Disconnect failed.',
      ) as Promise<void>,
    checkConnectionHealth: (connectionId: string) =>
      send(
        `/agent-integrations/connections/${encodeURIComponent(connectionId)}/health`,
        'POST',
        undefined,
        'Health check failed.',
      ) as Promise<{ connection: IntegrationConnection }>,
    reconnectConnection: (connectionId: string) =>
      send(
        `/agent-integrations/connections/${encodeURIComponent(connectionId)}/reconnect`,
        'POST',
        undefined,
        'Reconnect failed.',
      ) as Promise<ReconnectResult>,
    listNativeIntegrations: () =>
      getJson('/agent-integrations', 'Integrations could not be loaded.') as Promise<{
        integrations: AgentIntegrationSummary[];
      }>,
    connectNative: (key: AgentIntegrationKey, data: ConnectAgentIntegrationInput) =>
      send(
        `/agent-integrations/${encodeURIComponent(key)}`,
        'PUT',
        data,
        'Connect failed.',
      ) as Promise<{ integration: AgentIntegrationSummary }>,
    testNative: (key: AgentIntegrationKey) =>
      send(
        `/agent-integrations/${encodeURIComponent(key)}/test`,
        'POST',
        undefined,
        'Test failed.',
      ) as Promise<{ integration: AgentIntegrationSummary }>,
    disconnectNative: (key: AgentIntegrationKey) =>
      send(
        `/agent-integrations/${encodeURIComponent(key)}`,
        'DELETE',
        undefined,
        'Disconnect failed.',
      ) as Promise<{ integration: AgentIntegrationSummary }>,
  };
}
