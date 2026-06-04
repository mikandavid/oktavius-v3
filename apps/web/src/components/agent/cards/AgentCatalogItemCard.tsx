import { Badge, DetailFieldGrid, SectionCard } from '@oktavius/base-ui';

import type { AgentCatalogItemCardPayload } from '../types';

type AgentCatalogItemCardProps = AgentCatalogItemCardPayload & {
  className?: string;
} & Record<string, unknown>;

function normalizeFields(props: Record<string, unknown>) {
  if (Array.isArray(props.fields)) {
    return props.fields as Array<{ label: string; value: string }>;
  }
  const fields: Array<{ label: string; value: string }> = [];
  for (const [key, value] of Object.entries(props)) {
    if (['kind', 'title', 'sku', 'price', 'status', 'fields', 'className', 'name'].includes(key)) {
      continue;
    }
    if (typeof value === 'object') continue;
    fields.push({ label: key, value: String(value ?? '—') });
  }
  return fields;
}

export function AgentCatalogItemCard(props: AgentCatalogItemCardProps) {
  const title = (props.title as string) ?? (props.name as string) ?? 'Catalog item';
  const sku = props.sku as string | undefined;
  const price = props.price as string | undefined;
  const status = props.status as string | undefined;
  const fields = props.fields ?? normalizeFields(props);

  return (
    <SectionCard
      className={props.className}
      title={title}
      meta={sku ? `SKU ${sku}` : undefined}
      actions={
        <div className="flex items-center gap-2">
          {price ? <Badge variant="secondary">{price}</Badge> : null}
          {status ? <Badge variant="info">{status}</Badge> : null}
        </div>
      }
    >
      {fields.length > 0 ? (
        <DetailFieldGrid
          fields={fields.map((field) => ({ label: field.label, value: field.value }))}
        />
      ) : (
        <p className="text-xs text-muted-foreground">No additional details.</p>
      )}
    </SectionCard>
  );
}

export default AgentCatalogItemCard;

export function normalizeCatalogItemProps(
  props: Record<string, unknown>,
): AgentCatalogItemCardPayload {
  if (props.kind === 'catalog-item') return props as AgentCatalogItemCardPayload;
  return {
    kind: 'catalog-item',
    title: (props.title as string) ?? (props.name as string) ?? 'Catalog item',
    sku: props.sku as string | undefined,
    price: props.price as string | undefined,
    status: props.status as string | undefined,
    fields: normalizeFields(props),
  };
}
