import { describe, expect, it, vi } from 'vitest';

import { createDemoNotificationsRuntime } from '@/components/demo/demoNotificationsRuntime';

describe('NotificationsRuntime', () => {
  it('tracks unread count and marks one notification read', async () => {
    const runtime = createDemoNotificationsRuntime([
      { id: 'n1', title: 'One', subtitle: 'First', time: 'Now', isRead: false },
      { id: 'n2', title: 'Two', subtitle: 'Second', time: 'Now', isRead: false },
    ]);
    const listener = vi.fn();
    const unsubscribe = runtime.subscribe(listener);

    await expect(runtime.fetchUnreadCount()).resolves.toBe(2);
    await runtime.markRead('n1');

    await expect(runtime.fetchUnreadCount()).resolves.toBe(1);
    expect(listener).toHaveBeenLastCalledWith({
      notifications: [
        { id: 'n1', title: 'One', subtitle: 'First', time: 'Now', isRead: true },
        { id: 'n2', title: 'Two', subtitle: 'Second', time: 'Now', isRead: false },
      ],
      unreadCount: 1,
    });

    unsubscribe();
  });

  it('marks all notifications read', async () => {
    const runtime = createDemoNotificationsRuntime([
      { id: 'n1', title: 'One', subtitle: 'First', time: 'Now', isRead: false },
    ]);

    await runtime.markAllRead();

    await expect(runtime.fetchUnreadCount()).resolves.toBe(0);
    await expect(runtime.fetchNotifications()).resolves.toEqual([
      { id: 'n1', title: 'One', subtitle: 'First', time: 'Now', isRead: true },
    ]);
  });
});
