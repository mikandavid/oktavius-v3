export type NotificationItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  isRead: boolean;
};

export type NotificationChannel = 'in_app' | 'email' | 'push' | 'whatsapp';
export type NotificationPreferenceState = 'enabled' | 'disabled' | 'summary';
export type NotificationExplicitPreferenceState = 'inherited' | NotificationPreferenceState;

export type NotificationSettingsChannel = {
  channel: NotificationChannel;
  allowed: boolean;
  supportsSummary: boolean;
  effectiveState: NotificationPreferenceState;
  explicitState: NotificationExplicitPreferenceState;
  defaultState: NotificationPreferenceState;
  disabledReason?: string;
};

export type NotificationSettingsType = {
  key: string;
  title: string;
  description: string;
  severity: string;
  channels: NotificationSettingsChannel[];
};

export type NotificationSettingsCategory = {
  key: string;
  label: string;
  types: NotificationSettingsType[];
};

export type NotificationSettingsModule = {
  moduleId: string;
  moduleName: string;
  enabled: boolean;
  categories: NotificationSettingsCategory[];
};

export type NotificationSettings = {
  modules: NotificationSettingsModule[];
};

export type NotificationSubscriptionUpdate = {
  notificationTypeKey: string;
  channel: NotificationChannel;
  state: NotificationExplicitPreferenceState;
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
  fetchSettings: () => Promise<NotificationSettings>;
  updateSubscription: (input: NotificationSubscriptionUpdate) => Promise<void>;
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
  fetchSettings: async () => ({ modules: [] }),
  updateSubscription: async () => {},
};
