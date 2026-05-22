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

const DEMO_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Contract renewal due',
    subtitle: 'Apex Technologies · in 7 days',
    time: '2h ago',
  },
  {
    id: 'n2',
    title: 'Import completed',
    subtitle: '42 clients added from sample.csv',
    time: 'Yesterday',
  },
  {
    id: 'n3',
    title: 'User invitation accepted',
    subtitle: 'Markus Leitner joined West Region Branch',
    time: 'Mon',
  },
] as const;

type NotificationPanelProps = {
  className?: string;
};

export function NotificationPanel({ className }: NotificationPanelProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label="Notifications"
        >
          <NotificationsIcon size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cta ring-2 ring-card" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
            Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-72">
          <div className="divide-y divide-border/50">
            {DEMO_NOTIFICATIONS.map((item) => (
              <ListRow
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                trailing={<span className="text-xs text-muted-foreground">{item.time}</span>}
                onClick={() => {}}
                className="px-3"
              />
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
