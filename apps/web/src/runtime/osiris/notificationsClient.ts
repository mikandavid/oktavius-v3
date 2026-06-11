import type {
  NotificationChannel,
  NotificationItem,
  NotificationPreferenceState,
  NotificationSettings,
  NotificationSettingsCategory,
  NotificationSettingsChannel,
  NotificationSettingsModule,
  NotificationSettingsType,
  NotificationSubscriptionUpdate,
  NotificationsRuntimeAdapter,
  NotificationsRuntimeEvent,
} from '@/components/layout/NotificationsRuntime';

import { joinOsirisApiBaseUrl } from './apiBaseUrl';

export type OsirisNotificationsFetcher = (input: string, init?: RequestInit) => Promise<Response>;

type OsirisNotificationEventSource = {
  onmessage: ((event: { data: string }) => void) | null;
  onerror: (() => void) | null;
  close: () => void;
};

type OsirisNotificationEventSourceFactory = (
  url: string,
  init?: { withCredentials?: boolean },
) => OsirisNotificationEventSource;

type CreateOsirisNotificationsRuntimeOptions = {
  baseUrl?: string;
  fetcher?: OsirisNotificationsFetcher;
  eventSourceFactory?: OsirisNotificationEventSourceFactory | null;
  limit?: number;
  pollIntervalMs?: number;
};

function getDefaultFetcher(): OsirisNotificationsFetcher {
  if (typeof fetch !== 'function') {
    throw new Error('No fetch implementation is available for Osiris notifications.');
  }

  return fetch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') return value;
  }
  return null;
}

function readBoolean(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
  }
  return false;
}

function readArray(record: Record<string, unknown>, key: string): unknown[] {
  return Array.isArray(record[key]) ? record[key] : [];
}

function readChannel(value: unknown): NotificationChannel | null {
  return value === 'in_app' || value === 'email' || value === 'push' || value === 'whatsapp'
    ? value
    : null;
}

function readPreferenceState(value: unknown): NotificationPreferenceState {
  return value === 'enabled' || value === 'summary' ? value : 'disabled';
}

function readExplicitPreferenceState(value: unknown) {
  return value === 'inherited' || value === 'enabled' || value === 'disabled' || value === 'summary'
    ? value
    : 'inherited';
}

function notificationRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.notifications)) return payload.notifications;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function normalizeNotification(value: unknown): NotificationItem | null {
  if (!isRecord(value)) return null;

  const id = readString(value, ['id']);
  const title = readString(value, ['title', 'subject']);
  if (!id || !title) return null;

  return {
    id,
    title,
    subtitle: readString(value, ['subtitle', 'body', 'message', 'description']) ?? '',
    time: readString(value, ['time', 'createdAt', 'created_at', 'created']) ?? '',
    isRead: readBoolean(value, ['isRead', 'is_read', 'read']),
  };
}

function normalizeSettingsChannel(value: unknown): NotificationSettingsChannel | null {
  if (!isRecord(value)) return null;
  const channel = readChannel(value.channel);
  if (!channel) return null;

  const disabledReason = readString(value, ['disabledReason', 'disabled_reason']);

  return {
    channel,
    allowed: readBoolean(value, ['allowed']),
    supportsSummary: readBoolean(value, ['supportsSummary', 'supports_summary']),
    effectiveState: readPreferenceState(value.effectiveState ?? value.effective_state),
    explicitState: readExplicitPreferenceState(value.explicitState ?? value.explicit_state),
    defaultState: readPreferenceState(value.defaultState ?? value.default_state),
    ...(disabledReason ? { disabledReason } : {}),
  };
}

function normalizeSettingsType(value: unknown): NotificationSettingsType | null {
  if (!isRecord(value)) return null;
  const key = readString(value, ['key']);
  const title = readString(value, ['title']);
  if (!key || !title) return null;

  return {
    key,
    title,
    description: readString(value, ['description']) ?? '',
    severity: readString(value, ['severity']) ?? 'info',
    channels: readArray(value, 'channels')
      .map(normalizeSettingsChannel)
      .filter((channel) => channel !== null),
  };
}

function normalizeSettingsCategory(value: unknown): NotificationSettingsCategory | null {
  if (!isRecord(value)) return null;
  const key = readString(value, ['key']);
  const label = readString(value, ['label']);
  if (!key || !label) return null;

  return {
    key,
    label,
    types: readArray(value, 'types')
      .map(normalizeSettingsType)
      .filter((type) => type !== null),
  };
}

function normalizeSettingsModule(value: unknown): NotificationSettingsModule | null {
  if (!isRecord(value)) return null;
  const moduleId = readString(value, ['moduleId', 'module_id']);
  const moduleName = readString(value, ['moduleName', 'module_name', 'name']);
  if (!moduleId || !moduleName) return null;

  return {
    moduleId,
    moduleName,
    enabled: readBoolean(value, ['enabled']),
    categories: readArray(value, 'categories')
      .map(normalizeSettingsCategory)
      .filter((category) => category !== null),
  };
}

function normalizeSettings(payload: unknown): NotificationSettings {
  if (!isRecord(payload)) return { modules: [] };
  return {
    modules: readArray(payload, 'modules')
      .map(normalizeSettingsModule)
      .filter((module) => module !== null),
  };
}

function unreadCount(notifications: NotificationItem[]) {
  return notifications.filter((notification) => !notification.isRead).length;
}

function unreadCountFromPayload(payload: unknown, notifications: NotificationItem[]) {
  if (isRecord(payload)) {
    const rawCount = payload.unreadCount ?? payload.unread_count ?? payload.count;
    if (typeof rawCount === 'number') return rawCount;
  }

  return unreadCount(notifications);
}

function eventFromPayload(payload: unknown): NotificationsRuntimeEvent {
  const notifications = notificationRows(payload)
    .map(normalizeNotification)
    .filter((item) => item !== null);

  return { notifications, unreadCount: unreadCountFromPayload(payload, notifications) };
}

async function parseJson(response: Response) {
  if (!response.ok) {
    throw new Error(`Osiris notifications request failed with ${response.status}`);
  }

  return (await response.json()) as unknown;
}

function defaultEventSourceFactory(): OsirisNotificationEventSourceFactory | null {
  if (typeof EventSource !== 'function') return null;

  return (url, init) => new EventSource(url, init) as unknown as OsirisNotificationEventSource;
}

export function createOsirisNotificationsRuntime({
  baseUrl,
  eventSourceFactory = defaultEventSourceFactory(),
  fetcher,
  limit = 20,
  pollIntervalMs = 30_000,
}: CreateOsirisNotificationsRuntimeOptions): NotificationsRuntimeAdapter {
  const listeners = new Set<(event: NotificationsRuntimeEvent) => void>();
  const request: OsirisNotificationsFetcher = (input, init) =>
    (fetcher ?? getDefaultFetcher())(input, init);

  const fetchNotifications = async () => {
    const response = await request(
      joinOsirisApiBaseUrl(baseUrl, `/notifications?limit=${encodeURIComponent(String(limit))}`),
      {
        credentials: 'include',
      },
    );
    const payload = await parseJson(response);
    return notificationRows(payload)
      .map(normalizeNotification)
      .filter((item) => item !== null);
  };

  const emit = async () => {
    if (listeners.size === 0) return;
    const notifications = await fetchNotifications();
    const event = { notifications, unreadCount: unreadCount(notifications) };
    listeners.forEach((listener) => listener(event));
  };

  const emitEvent = (event: NotificationsRuntimeEvent) => {
    if (listeners.size === 0) return;
    listeners.forEach((listener) => listener(event));
  };

  return {
    subscribe(onEvent) {
      listeners.add(onEvent);
      void emit();

      let timer: number | undefined;
      let stream: OsirisNotificationEventSource | null = null;

      const startPolling = () => {
        if (typeof window === 'undefined' || pollIntervalMs <= 0 || timer !== undefined) return;
        timer = window.setInterval(() => void emit(), pollIntervalMs);
      };

      if (eventSourceFactory) {
        stream = eventSourceFactory(
          joinOsirisApiBaseUrl(
            baseUrl,
            `/notifications/stream?limit=${encodeURIComponent(String(limit))}`,
          ),
          { withCredentials: true },
        );
        stream.onmessage = (event) => {
          try {
            emitEvent(eventFromPayload(JSON.parse(event.data) as unknown));
          } catch (error) {
            console.warn('[notifications] failed to parse realtime event', error);
          }
        };
        stream.onerror = () => {
          stream?.close();
          stream = null;
          startPolling();
        };
      } else {
        startPolling();
      }

      return () => {
        listeners.delete(onEvent);
        stream?.close();
        if (timer !== undefined) window.clearInterval(timer);
      };
    },
    fetchNotifications,
    async fetchUnreadCount() {
      const response = await request(joinOsirisApiBaseUrl(baseUrl, '/notifications/unread-count'), {
        credentials: 'include',
      });
      const payload = await parseJson(response);
      if (isRecord(payload) && typeof payload.count === 'number') return payload.count;

      const notifications = notificationRows(payload).map(normalizeNotification);
      return unreadCount(notifications.filter((item) => item !== null));
    },
    async markRead(id) {
      const response = await request(
        joinOsirisApiBaseUrl(baseUrl, `/notifications/${encodeURIComponent(id)}/read`),
        {
          method: 'POST',
          credentials: 'include',
        },
      );
      await parseJson(response);
      void emit();
    },
    async markAllRead() {
      const response = await request(joinOsirisApiBaseUrl(baseUrl, '/notifications/read-all'), {
        method: 'POST',
        credentials: 'include',
      });
      await parseJson(response);
      void emit();
    },
    async fetchSettings() {
      const response = await request(joinOsirisApiBaseUrl(baseUrl, '/notifications/settings'), {
        credentials: 'include',
      });
      return normalizeSettings(await parseJson(response));
    },
    async updateSubscription(input: NotificationSubscriptionUpdate) {
      const response = await request(
        joinOsirisApiBaseUrl(baseUrl, '/notifications/subscriptions'),
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
      await parseJson(response);
    },
  };
}
