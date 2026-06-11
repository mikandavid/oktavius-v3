import type {
  NotificationItem,
  NotificationsRuntimeAdapter,
  NotificationsRuntimeEvent,
} from '@/components/layout/NotificationsRuntime';

import { joinOsirisApiBaseUrl } from './apiBaseUrl';

export type OsirisNotificationsFetcher = (input: string, init?: RequestInit) => Promise<Response>;

type CreateOsirisNotificationsRuntimeOptions = {
  baseUrl?: string;
  fetcher?: OsirisNotificationsFetcher;
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

function unreadCount(notifications: NotificationItem[]) {
  return notifications.filter((notification) => !notification.isRead).length;
}

async function parseJson(response: Response) {
  if (!response.ok) {
    throw new Error(`Osiris notifications request failed with ${response.status}`);
  }

  return (await response.json()) as unknown;
}

export function createOsirisNotificationsRuntime({
  baseUrl,
  fetcher = getDefaultFetcher(),
  limit = 20,
  pollIntervalMs = 30_000,
}: CreateOsirisNotificationsRuntimeOptions): NotificationsRuntimeAdapter {
  const listeners = new Set<(event: NotificationsRuntimeEvent) => void>();

  const fetchNotifications = async () => {
    const response = await fetcher(
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

  return {
    subscribe(onEvent) {
      listeners.add(onEvent);
      void emit();

      const timer =
        typeof window === 'undefined' || pollIntervalMs <= 0
          ? undefined
          : window.setInterval(() => void emit(), pollIntervalMs);

      return () => {
        listeners.delete(onEvent);
        if (timer !== undefined) window.clearInterval(timer);
      };
    },
    fetchNotifications,
    async fetchUnreadCount() {
      const response = await fetcher(joinOsirisApiBaseUrl(baseUrl, '/notifications/unread-count'), {
        credentials: 'include',
      });
      const payload = await parseJson(response);
      if (isRecord(payload) && typeof payload.count === 'number') return payload.count;

      const notifications = notificationRows(payload).map(normalizeNotification);
      return unreadCount(notifications.filter((item) => item !== null));
    },
    async markRead(id) {
      const response = await fetcher(
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
      const response = await fetcher(joinOsirisApiBaseUrl(baseUrl, '/notifications/read-all'), {
        method: 'POST',
        credentials: 'include',
      });
      await parseJson(response);
      void emit();
    },
  };
}
