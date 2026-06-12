import { Badge, ListRow, SectionCard } from '@oktavius/base-ui';
import { formatDisplayDateTime } from '@oktavius/base-ui';

import { BrainIcon } from '@/lib/icons';

import type { AgentMemoryCardPayload, AgentMemoryEntry } from '../types';

type AgentMemoryCardProps = AgentMemoryCardPayload & {
  className?: string;
} & Record<string, unknown>;

function normalizeEntries(props: Record<string, unknown>): AgentMemoryEntry[] {
  const raw = props.entries ?? props.results ?? props.items;
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => entry as AgentMemoryEntry);
}

export function AgentMemoryCard(props: AgentMemoryCardProps) {
  const entries = props.entries ?? normalizeEntries(props);
  const title = (props.title as string | undefined) ?? 'Memory';
  const query = props.query as string | undefined;

  return (
    <SectionCard
      className={props.className}
      title={title}
      meta={query ? `Query: ${query}` : `${entries.length} matches`}
      actions={<BrainIcon size={16} className="text-muted-foreground" />}
    >
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No memory entries.</p>
      ) : (
        <div className="space-y-1">
          {entries.slice(0, 8).map((entry, index) => (
            <ListRow
              key={entry.id ?? `${entry.title}-${index}`}
              title={entry.title ?? entry.summary ?? 'Memory entry'}
              subtitle={entry.summary && entry.title ? entry.summary : undefined}
              meta={
                <div className="flex items-center gap-1.5">
                  {entry.score != null ? (
                    <Badge variant="secondary">{Math.round(entry.score * 100)}%</Badge>
                  ) : null}
                  {entry.createdAt ? (
                    <span className="text-[11px] text-muted-foreground">
                      {formatDisplayDateTime(entry.createdAt)}
                    </span>
                  ) : null}
                </div>
              }
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default AgentMemoryCard;

export function normalizeMemoryProps(props: Record<string, unknown>): AgentMemoryCardPayload {
  if (props.kind === 'memory') return props as AgentMemoryCardPayload;
  return {
    kind: 'memory',
    title: props.title as string | undefined,
    query: props.query as string | undefined,
    entries: normalizeEntries(props),
  };
}
