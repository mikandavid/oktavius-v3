import { afterEach, describe, expect, it, vi } from 'vitest';

import { createOsirisAgentIntegrationsClient } from './agentIntegrationsClient';

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    })) as unknown as typeof fetch,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('agentIntegrationsClient', () => {
  it('lists connections from GET /agent-integrations/connections', async () => {
    mockFetchOnce({ connections: [{ id: 'c1', provider: 'pipedream', appKey: 'slack' }] });
    const client = createOsirisAgentIntegrationsClient({ baseUrl: '/v1' });
    const result = await client.listConnections();
    expect(result.connections[0]?.id).toBe('c1');
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain(
      '/agent-integrations/connections',
    );
  });

  it('throws a readable error on non-ok', async () => {
    mockFetchOnce({ message: 'nope' }, false, 500);
    const client = createOsirisAgentIntegrationsClient({ baseUrl: '/v1' });
    await expect(client.listConnections()).rejects.toThrow(/nope|connections/i);
  });
});
