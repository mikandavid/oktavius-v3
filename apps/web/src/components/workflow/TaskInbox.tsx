import { InlineEmptyState, ListRow, SectionCard } from '@oktavius/base-ui';

import { StatusBadge } from '@/components/feedback/StatusBadge';
import { TasksIcon } from '@/lib/icons';

export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type TaskStatus = 'Open' | 'In progress' | 'Done' | 'Blocked';

export interface TaskInboxItem {
  id: string;
  title: string;
  module?: string;
  assignee?: string;
  dueAt?: string;
  priority: TaskPriority;
  status: TaskStatus;
}

const PRIORITY_VARIANT = {
  Low: 'secondary',
  Normal: 'secondary',
  High: 'warning',
  Urgent: 'destructive',
} as const;

const STATUS_VARIANT = {
  Open: 'info',
  'In progress': 'warning',
  Done: 'success',
  Blocked: 'destructive',
} as const;

export interface TaskInboxProps {
  items: TaskInboxItem[];
  onItemClick?: (id: string) => void;
  title?: string;
  meta?: string;
  emptyMessage?: string;
  className?: string;
}

/** Work queue for assigned tasks across modules. */
export function TaskInbox({
  items,
  onItemClick,
  title = 'My tasks',
  meta,
  emptyMessage = 'No open tasks.',
  className,
}: TaskInboxProps) {
  const openCount = items.filter((item) => item.status !== 'Done').length;

  return (
    <SectionCard title={title} meta={meta ?? `${openCount} open`} className={className}>
      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <ListRow
              key={item.id}
              variant="queue"
              leading={<TasksIcon size={16} className="text-muted-foreground" />}
              title={item.title}
              subtitle={
                <>
                  {item.module ? <span className="block">{item.module}</span> : null}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {[item.assignee, item.dueAt].filter(Boolean).join(' · ')}
                  </span>
                </>
              }
              trailing={
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={item.priority} variantMap={PRIORITY_VARIANT} />
                  <StatusBadge status={item.status} variantMap={STATUS_VARIANT} />
                </div>
              }
              onClick={onItemClick ? () => onItemClick(item.id) : undefined}
            />
          ))}
        </div>
      ) : (
        <InlineEmptyState text={emptyMessage} centered />
      )}
    </SectionCard>
  );
}
