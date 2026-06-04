import { Badge, CountBadge, ListRow, SectionCard } from '@oktavius/base-ui';

import { ForwardIcon } from '@/lib/icons';

import type { AgentEntityListCardPayload } from '../types';

type AgentEntityListCardProps = AgentEntityListCardPayload & {
  onItemClick?: (itemId: string, href?: string) => void;
  className?: string;
};

export function AgentEntityListCard({
  title = 'Results',
  total,
  items,
  onItemClick,
  className,
}: AgentEntityListCardProps) {
  const count = total ?? items.length;

  return (
    <SectionCard
      className={className}
      title={title}
      meta={`${count} record${count === 1 ? '' : 's'}`}
      actions={<CountBadge count={count} />}
    >
      <div className="space-y-1">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={item.label}
            subtitle={item.subtitle}
            meta={item.status ? <Badge variant="secondary">{item.status}</Badge> : undefined}
            trailing={
              item.href || onItemClick ? (
                <ForwardIcon size={14} className="text-muted-foreground" />
              ) : undefined
            }
            onClick={item.href || onItemClick ? () => onItemClick?.(item.id, item.href) : undefined}
          />
        ))}
      </div>
    </SectionCard>
  );
}
