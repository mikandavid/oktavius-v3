import { Badge, SectionCard } from '@oktavius/base-ui';
import { formatDisplayDateTime } from '@oktavius/base-ui';

import { SquareIcon, SuccessIcon } from '@/lib/icons';

import type { AgentActionItem, AgentActionItemsCardPayload } from '../types';

type AgentActionItemsCardProps = AgentActionItemsCardPayload & {
  className?: string;
} & Record<string, unknown>;

const PRIORITY_VARIANT: Record<string, 'default' | 'destructive' | 'warning' | 'secondary'> = {
  urgent: 'destructive',
  high: 'destructive',
  medium: 'warning',
  low: 'secondary',
};

function normalizeItems(props: Record<string, unknown>): AgentActionItem[] {
  const raw = props.items ?? props.tasks;
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => item as AgentActionItem);
}

export function AgentActionItemsCard(props: AgentActionItemsCardProps) {
  const items = props.items ?? normalizeItems(props);
  const title = (props.title as string | undefined) ?? 'Action items';
  const pendingCount = items.filter((item) => !item.completed).length;

  return (
    <SectionCard
      className={props.className}
      title={title}
      meta={pendingCount > 0 ? `${pendingCount} pending` : 'All done'}
      actions={
        pendingCount > 0 ? <Badge variant="warning">{pendingCount} pending</Badge> : undefined
      }
    >
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No action items.</p>
      ) : (
        <ul className="max-h-48 space-y-1.5 overflow-y-auto">
          {items.slice(0, 10).map((item, index) => {
            const label = item.title ?? item.label ?? item.description ?? 'Task';
            const Icon = item.completed ? SuccessIcon : SquareIcon;
            return (
              <li key={item.id ?? `${label}-${index}`} className="flex items-start gap-2 text-sm">
                <Icon
                  size={16}
                  className={item.completed ? 'text-success' : 'text-muted-foreground'}
                />
                <div className="min-w-0 flex-1">
                  <div className={item.completed ? 'text-muted-foreground line-through' : ''}>
                    {label}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    {item.priority ? (
                      <Badge variant={PRIORITY_VARIANT[item.priority] ?? 'secondary'}>
                        {item.priority}
                      </Badge>
                    ) : null}
                    {item.dueDate ? (
                      <span className="text-xs text-muted-foreground">
                        Due {formatDisplayDateTime(item.dueDate)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

export default AgentActionItemsCard;

export function normalizeActionItemsProps(
  props: Record<string, unknown>,
): AgentActionItemsCardPayload {
  if (props.kind === 'action-items') return props as AgentActionItemsCardPayload;
  return {
    kind: 'action-items',
    title: props.title as string | undefined,
    items: normalizeItems(props),
  };
}
