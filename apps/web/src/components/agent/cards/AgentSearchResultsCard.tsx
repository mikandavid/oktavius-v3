import { Badge, CountBadge, ListRow, SectionCard } from '@oktavius/base-ui';
import { useNavigate } from 'react-router-dom';

import { SearchIcon } from '@/lib/icons';

import { readLabel } from '../cardUtils';
import type {
  AgentSearchResultGroup,
  AgentSearchResultItem,
  AgentSearchResultsCardPayload,
} from '../types';

type AgentSearchResultsCardProps = AgentSearchResultsCardPayload & {
  className?: string;
  onItemClick?: (item: AgentSearchResultItem) => void;
} & Record<string, unknown>;

function normalizeItems(items: unknown): AgentSearchResultItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item && typeof item === 'object') as AgentSearchResultItem[];
}

function ResultList({
  items,
  onItemClick,
}: {
  items: AgentSearchResultItem[];
  onItemClick?: (item: AgentSearchResultItem) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-1">
      {items.map((item, index) => {
        const label = readLabel(item as Record<string, unknown>);
        const href = item.href ?? item.route;
        return (
          <ListRow
            key={item.id ?? `${label}-${index}`}
            title={label}
            subtitle={item.subtitle ?? item.description}
            meta={item.type ? <Badge variant="secondary">{item.type}</Badge> : undefined}
            onClick={
              href || onItemClick
                ? () => {
                    if (href) navigate(href);
                    onItemClick?.(item);
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}

export function AgentSearchResultsCard(props: AgentSearchResultsCardProps) {
  const groups =
    props.groups ??
    (Array.isArray(props.results) ? (props.results as AgentSearchResultGroup[]) : undefined);
  const flatItems = props.items ?? normalizeItems(props.items);
  const query = props.query as string | undefined;
  const totalCount =
    props.totalCount ??
    (groups
      ? groups.reduce((sum, group) => sum + (group.items?.length ?? 0), 0)
      : flatItems.length);

  if ((!groups || groups.length === 0) && flatItems.length > 0) {
    return (
      <SectionCard
        className={props.className}
        title="Search results"
        meta={query ? `“${query}”` : undefined}
        actions={<CountBadge count={flatItems.length} />}
      >
        <ResultList items={flatItems} onItemClick={props.onItemClick} />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      className={props.className}
      title="Search results"
      meta={query ? `“${query}”` : undefined}
      actions={
        <div className="flex items-center gap-2">
          <SearchIcon size={14} className="text-muted-foreground" />
          <CountBadge count={totalCount} />
        </div>
      }
    >
      <div className="space-y-3">
        {(groups ?? []).map((group, index) => {
          const groupItems = group.items ?? [];
          const label = group.type ?? group.category ?? `Group ${index + 1}`;
          return (
            <div key={`${label}-${index}`}>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </div>
              <ResultList items={groupItems} onItemClick={props.onItemClick} />
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

export default AgentSearchResultsCard;

export function normalizeSearchResultsProps(
  props: Record<string, unknown>,
): AgentSearchResultsCardPayload {
  if (props.kind === 'search-results') return props as AgentSearchResultsCardPayload;
  return {
    kind: 'search-results',
    query: props.query as string | undefined,
    totalCount: props.totalCount as number | undefined,
    groups:
      (props.results as AgentSearchResultGroup[] | undefined) ??
      (props.groups as AgentSearchResultGroup[] | undefined),
    items: normalizeItems(props.items),
  };
}
