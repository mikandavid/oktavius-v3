import { Badge, Button, DetailFieldGrid, SectionCard } from '@oktavius/base-ui';

import { ForwardIcon, InvoiceIcon } from '@/lib/icons';

import type { AgentSalesDocumentCardPayload } from '../types';

type AgentSalesDocumentCardProps = AgentSalesDocumentCardPayload & {
  className?: string;
  onOpen?: (href?: string) => void;
} & Record<string, unknown>;

function normalizeFields(props: Record<string, unknown>) {
  if (Array.isArray(props.fields)) {
    return props.fields as Array<{ label: string; value: string }>;
  }
  const fields: Array<{ label: string; value: string }> = [];
  for (const [key, value] of Object.entries(props)) {
    if (
      [
        'kind',
        'title',
        'documentNumber',
        'status',
        'total',
        'dueDate',
        'fields',
        'href',
        'className',
        'name',
      ].includes(key)
    ) {
      continue;
    }
    if (typeof value === 'object') continue;
    fields.push({ label: key, value: String(value ?? '—') });
  }
  return fields;
}

export function AgentSalesDocumentCard(props: AgentSalesDocumentCardProps) {
  const title = (props.title as string) ?? (props.name as string) ?? 'Sales document';
  const documentNumber = props.documentNumber ?? (props.number as string | undefined);
  const status = props.status as string | undefined;
  const total = props.total as string | undefined;
  const dueDate = props.dueDate as string | undefined;
  const fields = props.fields ?? normalizeFields(props);
  const href = props.href as string | undefined;

  return (
    <SectionCard
      className={props.className}
      title={title}
      meta={documentNumber}
      actions={
        <div className="flex items-center gap-2">
          <InvoiceIcon size={16} className="text-muted-foreground" />
          {status ? <Badge variant="info">{status}</Badge> : null}
        </div>
      }
    >
      <DetailFieldGrid
        fields={[
          ...(total ? [{ label: 'Total', value: total }] : []),
          ...(dueDate ? [{ label: 'Due date', value: dueDate }] : []),
          ...fields.map((field) => ({ label: field.label, value: field.value })),
        ]}
      />
      {href || props.onOpen ? (
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => props.onOpen?.(href)}>
            <ForwardIcon size={14} className="mr-1.5" />
            Open document
          </Button>
        </div>
      ) : null}
    </SectionCard>
  );
}

export default AgentSalesDocumentCard;

export function normalizeSalesDocumentProps(
  props: Record<string, unknown>,
): AgentSalesDocumentCardPayload {
  if (props.kind === 'sales-document') return props as AgentSalesDocumentCardPayload;
  return {
    kind: 'sales-document',
    title: (props.title as string) ?? (props.name as string) ?? 'Sales document',
    documentNumber: (props.documentNumber ?? props.number) as string | undefined,
    status: props.status as string | undefined,
    total: props.total as string | undefined,
    dueDate: props.dueDate as string | undefined,
    fields: normalizeFields(props),
    href: props.href as string | undefined,
  };
}
