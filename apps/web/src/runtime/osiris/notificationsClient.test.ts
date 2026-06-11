import { describe, expect, it, vi } from 'vitest';

import { createOsirisNotificationsRuntime } from './notificationsClient';

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createOsirisNotificationsRuntime', () => {
  it('loads notification rows from the Osiris notifications endpoint', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        data: [
          {
            id: 'notif_1',
            title: 'Approval requested',
            body: 'Invoice INV-1 needs review',
            createdAt: '2026-06-11T09:00:00.000Z',
            isRead: false,
          },
        ],
      }),
    );
    const runtime = createOsirisNotificationsRuntime({ baseUrl: '/v1', fetcher });

    await expect(runtime.fetchNotifications()).resolves.toEqual([
      {
        id: 'notif_1',
        title: 'Approval requested',
        subtitle: 'Invoice INV-1 needs review',
        time: '2026-06-11T09:00:00.000Z',
        isRead: false,
      },
    ]);
    expect(fetcher).toHaveBeenCalledWith('/v1/notifications?limit=20', {
      credentials: 'include',
    });
  });

  it('marks notifications read through Osiris endpoints', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ ok: true }));
    const runtime = createOsirisNotificationsRuntime({ baseUrl: '/v1', fetcher });

    await runtime.markRead('notif_1');
    await runtime.markAllRead();

    expect(fetcher).toHaveBeenNthCalledWith(1, '/v1/notifications/notif_1/read', {
      method: 'POST',
      credentials: 'include',
    });
    expect(fetcher).toHaveBeenNthCalledWith(2, '/v1/notifications/read-all', {
      method: 'POST',
      credentials: 'include',
    });
  });
});
