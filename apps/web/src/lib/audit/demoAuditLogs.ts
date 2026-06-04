export type AuditChange = {
  field: string;
  oldValue: unknown;
  newValue: unknown;
};

export type AuditEntry = {
  id: string;
  action: 'create' | 'update' | 'delete' | 'send' | 'payment' | string;
  entityType: string;
  entityId: string;
  userName?: string | null;
  source?: 'user' | 'ai' | 'agent' | 'system' | string | null;
  changes?: AuditChange[] | null;
  createdAt: string;
};

const DEMO_AUDIT_LOGS: Record<string, AuditEntry[]> = {
  cli_1001: [
    {
      id: 'aud_1',
      action: 'create',
      entityType: 'client',
      entityId: 'cli_1001',
      userName: 'Anna Hofer',
      source: 'user',
      createdAt: '2024-01-10T09:12:00.000Z',
    },
    {
      id: 'aud_2',
      action: 'update',
      entityType: 'client',
      entityId: 'cli_1001',
      userName: 'Anna Hofer',
      source: 'user',
      createdAt: '2024-06-03T14:22:00.000Z',
      changes: [
        { field: 'status', oldValue: 'prospect', newValue: 'active' },
        { field: 'accountManager', oldValue: 'Markus Leitner', newValue: 'Anna Hofer' },
      ],
    },
    {
      id: 'aud_3',
      action: 'update',
      entityType: 'client',
      entityId: 'cli_1001',
      userName: 'AI Agent',
      source: 'ai',
      createdAt: '2024-09-18T08:05:00.000Z',
      changes: [{ field: 'vipTier', oldValue: 'standard', newValue: 'gold' }],
    },
  ],
  cli_1002: [
    {
      id: 'aud_4',
      action: 'create',
      entityType: 'client',
      entityId: 'cli_1002',
      userName: 'Markus Leitner',
      source: 'user',
      createdAt: '2024-02-20T11:00:00.000Z',
    },
  ],
};

export function getDemoAuditLogs(entityType: string, entityId: string): AuditEntry[] {
  if (entityType !== 'client') return [];
  return DEMO_AUDIT_LOGS[entityId] ?? [];
}
