export type NotificationItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  isRead: boolean;
};

export type NotificationsRuntimeEvent = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export type NotificationsRuntimeAdapter = {
  subscribe: (onEvent: (event: NotificationsRuntimeEvent) => void) => () => void;
  fetchNotifications: () => Promise<NotificationItem[]>;
  fetchUnreadCount: () => Promise<number>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

export const EMPTY_NOTIFICATIONS_RUNTIME: NotificationsRuntimeAdapter = {
  subscribe: (onEvent) => {
    onEvent({ notifications: [], unreadCount: 0 });
    return () => {};
  },
  fetchNotifications: async () => [],
  fetchUnreadCount: async () => 0,
  markRead: async () => {},
  markAllRead: async () => {},
};
