import type {
  NotificationItem,
  NotificationsRuntimeAdapter,
  NotificationsRuntimeEvent,
} from '@/components/layout/NotificationsRuntime';

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Contract renewal due',
    subtitle: 'Apex Technologies · in 7 days',
    time: '2h ago',
    isRead: false,
  },
  {
    id: 'n2',
    title: 'Import completed',
    subtitle: '42 clients added from sample.csv',
    time: 'Yesterday',
    isRead: false,
  },
  {
    id: 'n3',
    title: 'User invitation accepted',
    subtitle: 'Markus Leitner joined West Region Branch',
    time: 'Mon',
    isRead: true,
  },
];

function unreadCount(notifications: NotificationItem[]) {
  return notifications.filter((item) => !item.isRead).length;
}

export function createDemoNotificationsRuntime(
  initialNotifications = DEMO_NOTIFICATIONS,
): NotificationsRuntimeAdapter {
  let notifications = initialNotifications.map((item) => ({ ...item }));
  const listeners = new Set<(event: NotificationsRuntimeEvent) => void>();

  const emit = () => {
    const event = {
      notifications: notifications.map((item) => ({ ...item })),
      unreadCount: unreadCount(notifications),
    };
    for (const listener of listeners) listener(event);
  };

  return {
    subscribe: (onEvent) => {
      listeners.add(onEvent);
      onEvent({
        notifications: notifications.map((item) => ({ ...item })),
        unreadCount: unreadCount(notifications),
      });
      return () => listeners.delete(onEvent);
    },
    fetchNotifications: async () => notifications.map((item) => ({ ...item })),
    fetchUnreadCount: async () => unreadCount(notifications),
    markRead: async (id) => {
      notifications = notifications.map((item) =>
        item.id === id ? { ...item, isRead: true } : item,
      );
      emit();
    },
    markAllRead: async () => {
      notifications = notifications.map((item) => ({ ...item, isRead: true }));
      emit();
    },
    fetchSettings: async () => ({ modules: [] }),
    updateSubscription: async () => undefined,
  };
}

export const DEMO_NOTIFICATIONS_RUNTIME = createDemoNotificationsRuntime();
