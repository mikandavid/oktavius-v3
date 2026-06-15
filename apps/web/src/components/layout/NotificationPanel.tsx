import {
  Button,
  cn,
  ListRow,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from '@oktavius/base-ui';
import { useEffect, useMemo, useState } from 'react';

import { NotificationsIcon } from '@/lib/icons';

import {
  EMPTY_NOTIFICATIONS_RUNTIME,
  type NotificationItem,
  type NotificationsRuntimeAdapter,
} from './NotificationsRuntime';

type NotificationPanelProps = {
  className?: string;
  runtime?: NotificationsRuntimeAdapter;
};

export function NotificationPanel({
  className,
  runtime = EMPTY_NOTIFICATIONS_RUNTIME,
}: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void runtime.fetchNotifications().then((nextNotifications) => {
      if (!cancelled) setNotifications(nextNotifications);
    });
    const unsubscribe = runtime.subscribe((event) => {
      if (!cancelled) setNotifications(event.notifications);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [runtime]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const markRead = (id: string) => {
    void runtime.markRead(id);
  };

  const markAllRead = () => {
    void runtime.markAllRead();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground',
            className,
          )}
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <NotificationsIcon size={16} />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-foreground" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <p className="text-sm font-medium text-foreground">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            disabled={unreadCount === 0}
            onClick={markAllRead}
          >
            Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-72">
          <div className="px-1 py-1">
            {notifications.length === 0 ? (
              <div className="animate-in fade-in-0 slide-in-from-bottom-1 flex flex-col items-center justify-center px-4 py-8 text-center duration-300 ease-out">
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  style={{ animation: 'notif-bell-ring 0.65s ease-in-out 0.3s 1 both' }}
                >
                  <NotificationsIcon size={17} />
                </div>
                <p className="text-sm font-medium text-foreground/80">All caught up</p>
                <p className="mt-0.5 text-xs text-muted-foreground">No new notifications</p>
              </div>
            ) : (
              notifications.map((item) => (
                <ListRow
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  meta={item.time}
                  leading={
                    <span
                      aria-hidden
                      className={cn(
                        'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                        item.isRead ? 'bg-transparent' : 'bg-foreground',
                      )}
                    />
                  }
                  onClick={() => markRead(item.id)}
                  className="px-2"
                />
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
