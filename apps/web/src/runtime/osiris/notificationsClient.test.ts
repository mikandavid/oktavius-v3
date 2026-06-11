import { describe, expect, it, vi } from 'vitest';

import { createOsirisNotificationsRuntime } from './notificationsClient';

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

class FakeEventSource {
  static instances: FakeEventSource[] = [];

  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();

  constructor(
    public readonly url: string,
    public readonly init?: { withCredentials?: boolean },
  ) {
    FakeEventSource.instances.push(this);
  }
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

  it('loads notification settings and updates subscriptions through Osiris endpoints', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        modules: [
          {
            moduleId: 'invoices',
            moduleName: 'Invoices',
            enabled: true,
            categories: [
              {
                key: 'approval',
                label: 'Approvals',
                types: [
                  {
                    key: 'invoice.approval_requested',
                    title: 'Approval requested',
                    description: 'An invoice needs review.',
                    severity: 'info',
                    channels: [
                      {
                        channel: 'in_app',
                        allowed: true,
                        supportsSummary: false,
                        effectiveState: 'enabled',
                        explicitState: 'inherited',
                        defaultState: 'enabled',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    );
    const runtime = createOsirisNotificationsRuntime({ baseUrl: '/v1', fetcher });

    await expect(runtime.fetchSettings()).resolves.toEqual({
      modules: [
        {
          moduleId: 'invoices',
          moduleName: 'Invoices',
          enabled: true,
          categories: [
            {
              key: 'approval',
              label: 'Approvals',
              types: [
                {
                  key: 'invoice.approval_requested',
                  title: 'Approval requested',
                  description: 'An invoice needs review.',
                  severity: 'info',
                  channels: [
                    {
                      channel: 'in_app',
                      allowed: true,
                      supportsSummary: false,
                      effectiveState: 'enabled',
                      explicitState: 'inherited',
                      defaultState: 'enabled',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    await runtime.updateSubscription({
      notificationTypeKey: 'invoice.approval_requested',
      channel: 'in_app',
      state: 'disabled',
    });

    expect(fetcher).toHaveBeenNthCalledWith(1, '/v1/notifications/settings', {
      credentials: 'include',
    });
    expect(fetcher).toHaveBeenNthCalledWith(2, '/v1/notifications/subscriptions', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationTypeKey: 'invoice.approval_requested',
        channel: 'in_app',
        state: 'disabled',
      }),
    });
  });

  it('subscribes to realtime notification events when an EventSource transport is available', async () => {
    FakeEventSource.instances = [];
    const fetcher = vi.fn(async () => jsonResponse({ notifications: [] }));
    const listener = vi.fn();
    const runtime = createOsirisNotificationsRuntime({
      baseUrl: '/v1',
      fetcher,
      pollIntervalMs: 0,
      eventSourceFactory: (url, init) => new FakeEventSource(url, init),
    });

    const unsubscribe = runtime.subscribe(listener);
    await Promise.resolve();

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.instances[0]?.url).toBe('/v1/notifications/stream?limit=20');
    expect(FakeEventSource.instances[0]?.init).toEqual({ withCredentials: true });

    FakeEventSource.instances[0]?.onmessage?.({
      data: JSON.stringify({
        notifications: [
          {
            id: 'notif_2',
            title: 'Realtime approval',
            message: 'A new approval is ready.',
            created_at: '2026-06-11T10:00:00.000Z',
            is_read: false,
          },
        ],
      }),
    });

    expect(listener).toHaveBeenLastCalledWith({
      notifications: [
        {
          id: 'notif_2',
          title: 'Realtime approval',
          subtitle: 'A new approval is ready.',
          time: '2026-06-11T10:00:00.000Z',
          isRead: false,
        },
      ],
      unreadCount: 1,
    });

    unsubscribe();
    expect(FakeEventSource.instances[0]?.close).toHaveBeenCalled();
  });

  it('falls back to polling when the realtime notification stream errors', async () => {
    vi.useFakeTimers();
    FakeEventSource.instances = [];
    const fetcher = vi.fn(async () =>
      jsonResponse({
        notifications: [
          {
            id: 'notif_3',
            title: 'Polled approval',
            message: 'Fetched after stream error.',
            created_at: '2026-06-11T11:00:00.000Z',
            is_read: false,
          },
        ],
      }),
    );
    const listener = vi.fn();
    const runtime = createOsirisNotificationsRuntime({
      baseUrl: '/v1',
      fetcher,
      pollIntervalMs: 1_000,
      eventSourceFactory: (url, init) => new FakeEventSource(url, init),
    });

    const unsubscribe = runtime.subscribe(listener);
    await Promise.resolve();

    fetcher.mockClear();
    FakeEventSource.instances[0]?.onerror?.();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(1_000);

    expect(FakeEventSource.instances[0]?.close).toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledWith('/v1/notifications?limit=20', {
      credentials: 'include',
    });
    expect(listener).toHaveBeenLastCalledWith({
      notifications: [
        {
          id: 'notif_3',
          title: 'Polled approval',
          subtitle: 'Fetched after stream error.',
          time: '2026-06-11T11:00:00.000Z',
          isRead: false,
        },
      ],
      unreadCount: 1,
    });

    unsubscribe();
    vi.useRealTimers();
  });
});
