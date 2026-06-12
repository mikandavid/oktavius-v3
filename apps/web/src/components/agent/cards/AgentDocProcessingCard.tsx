import { Badge, cn, DetailFieldGrid, SectionCard } from '@oktavius/base-ui';

import { DocumentIcon, SpinnerIcon } from '@/lib/icons';

import type { AgentDocProcessingCardPayload } from '../types';

type AgentDocProcessingCardProps = AgentDocProcessingCardPayload & {
  className?: string;
} & Record<string, unknown>;

function normalizeVariant(props: Record<string, unknown>): 'progress' | 'result' {
  if (props.variant === 'progress' || props.variant === 'result') return props.variant;
  if (props.progress != null || props.status === 'processing' || props.status === 'pending') {
    return 'progress';
  }
  return 'result';
}

export function AgentDocProcessingCard(props: AgentDocProcessingCardProps) {
  const variant = props.variant ?? normalizeVariant(props);
  const title = (props.title as string | undefined) ?? 'Document processing';
  const status = props.status ?? (variant === 'progress' ? 'processing' : 'completed');
  const progress = Math.min(
    100,
    Math.max(0, props.progress ?? (status === 'completed' ? 100 : 45)),
  );
  const message = props.message as string | undefined;
  const documentName = props.documentName ?? (props.name as string | undefined);
  const fields = props.fields ?? [];

  return (
    <SectionCard
      className={props.className}
      title={title}
      meta={documentName}
      actions={
        <Badge
          variant={
            status === 'failed' ? 'destructive' : status === 'completed' ? 'success' : 'info'
          }
        >
          {status}
        </Badge>
      }
    >
      {variant === 'progress' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SpinnerIcon size={16} className="animate-spin" />
            {message ?? 'Processing document…'}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full bg-primary transition-[width]')}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">{progress}% complete</div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <DocumentIcon size={16} className="text-muted-foreground" />
            {message ?? 'Extraction complete.'}
          </div>
          {fields.length > 0 ? (
            <DetailFieldGrid
              fields={fields.map((field) => ({ label: field.label, value: field.value }))}
            />
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}

export default AgentDocProcessingCard;

export function normalizeDocProcessingProps(
  props: Record<string, unknown>,
): AgentDocProcessingCardPayload {
  if (props.kind === 'doc-processing') return props as AgentDocProcessingCardPayload;
  return {
    kind: 'doc-processing',
    variant: normalizeVariant(props),
    title: props.title as string | undefined,
    status: props.status as AgentDocProcessingCardPayload['status'],
    progress: props.progress as number | undefined,
    message: props.message as string | undefined,
    documentName: (props.documentName ?? props.name) as string | undefined,
    fields: Array.isArray(props.fields)
      ? (props.fields as Array<{ label: string; value: string }>)
      : undefined,
  };
}
