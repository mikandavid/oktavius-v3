type OrgId = string | null;

export const agentAdminKeys = {
  root: (org: OrgId) => ['agent-admin', org] as const,
  connections: (org: OrgId) => ['agent-admin', org, 'connections'] as const,
  nativeIntegrations: (org: OrgId) => ['agent-admin', org, 'native-integrations'] as const,
  providerDiagnostics: (org: OrgId) => ['agent-admin', org, 'provider-diagnostics'] as const,
  appSearch: (org: OrgId, query: string) => ['agent-admin', org, 'app-search', query] as const,
  tasks: (org: OrgId) => ['agent-admin', org, 'tasks'] as const,
  task: (org: OrgId, taskId: string) => ['agent-admin', org, 'task', taskId] as const,
  taskRuns: (org: OrgId, taskId: string) => ['agent-admin', org, 'task-runs', taskId] as const,
  triggerMailboxes: (org: OrgId) => ['agent-admin', org, 'trigger-mailboxes'] as const,
  activations: (org: OrgId) => ['agent-admin', org, 'activations'] as const,
  activationRuns: (org: OrgId, taskId: string) =>
    ['agent-admin', org, 'activation-runs', taskId] as const,
  heartbeat: (org: OrgId) => ['agent-admin', org, 'heartbeat'] as const,
};
