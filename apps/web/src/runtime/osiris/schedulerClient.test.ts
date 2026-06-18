import { afterEach, describe, expect, it, vi } from 'vitest';

import { createOsirisSchedulerClient } from './schedulerClient';

afterEach(() => vi.unstubAllGlobals());

function mockFetch(body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => body,
      text: async () => JSON.stringify(body),
    })) as unknown as typeof fetch,
  );
}

describe('schedulerClient', () => {
  it('lists tasks from GET /scheduler', async () => {
    mockFetch({
      data: [{ id: 't1', name: 'Daily digest' }],
      total: 1,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    });
    const client = createOsirisSchedulerClient({ baseUrl: '/v1' });
    const result = await client.listTasks();
    expect(result.data[0]?.id).toBe('t1');
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('/scheduler');
  });
});
