import { humanizeKey } from '../cardUtils';
import { AgentEntityDetailCard } from './AgentEntityDetailCard';
import { AgentEntityListCard } from './AgentEntityListCard';
import type { AgentEntityDetailCardPayload, AgentEntityListCardPayload } from '../types';

export function normalizeEntityDetailProps(
  props: Record<string, unknown>,
): AgentEntityDetailCardPayload {
  if (props.kind === 'entity-detail') return props as AgentEntityDetailCardPayload;

  const title =
    (props.title as string | undefined) ??
    (props.name as string | undefined) ??
    (props.displayName as string | undefined) ??
    'Record';
  const fields: Array<{ label: string; value: string }> = [];

  if (Array.isArray(props.fields)) {
    for (const field of props.fields) {
      if (field && typeof field === 'object' && 'label' in field) {
        fields.push({
          label: String((field as { label: unknown }).label),
          value: String((field as { value?: unknown }).value ?? '—'),
        });
      }
    }
  } else {
    for (const [key, value] of Object.entries(props)) {
      if (
        [
          'kind',
          'title',
          'subtitle',
          'status',
          'href',
          'fields',
          'className',
          'name',
          'displayName',
          'id',
        ].includes(key)
      ) {
        continue;
      }
      if (typeof value === 'object') continue;
      fields.push({ label: humanizeKey(key), value: String(value ?? '—') });
    }
  }

  return {
    kind: 'entity-detail',
    title,
    subtitle: props.subtitle as string | undefined,
    status: props.status as string | undefined,
    href: (props.href ?? props.route ?? props.url) as string | undefined,
    fields: fields.slice(0, 8),
  };
}

export function normalizeEntityListProps(
  props: Record<string, unknown>,
): AgentEntityListCardPayload {
  if (props.kind === 'entity-list') return props as AgentEntityListCardPayload;

  const rawItems = props.items ?? props.results ?? props.records ?? props.data;
  const items = Array.isArray(rawItems)
    ? rawItems.map((item, index) => {
        const record = item as Record<string, unknown>;
        return {
          id: String(record.id ?? `item_${index}`),
          label: String(
            record.label ?? record.title ?? record.name ?? record.displayName ?? 'Item',
          ),
          subtitle: (record.subtitle ?? record.description) as string | undefined,
          status: record.status as string | undefined,
          href: (record.href ?? record.route ?? record.url) as string | undefined,
        };
      })
    : [];

  return {
    kind: 'entity-list',
    title: props.title as string | undefined,
    total: (props.total ?? props.totalCount ?? items.length) as number,
    items,
  };
}

export default function RegistryEntityDetailCard(props: Record<string, unknown>) {
  return <AgentEntityDetailCard {...normalizeEntityDetailProps(props)} />;
}

export function RegistryEntityListCard(props: Record<string, unknown>) {
  return <AgentEntityListCard {...normalizeEntityListProps(props)} />;
}
