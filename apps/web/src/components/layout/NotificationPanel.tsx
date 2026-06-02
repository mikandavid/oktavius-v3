import { useMemo, useState } from 'react';

import {
  Button,
  ListRow,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  cn,
} from '@oktavius/base-ui';

import { NotificationsIcon } from '@/lib/icons';

type NotificationItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  isRead: boolean;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
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

type NotificationPanelProps = {
  className?: string;
};

export function NotificationPanel({ className }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const markRead = (id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
  };

  const markAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
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
            {notifications.map((item) => (
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
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
