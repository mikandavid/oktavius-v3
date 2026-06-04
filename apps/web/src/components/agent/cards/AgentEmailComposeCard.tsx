import { Badge, Button, SectionCard } from '@oktavius/base-ui';

import { EmailIcon, ForwardIcon } from '@/lib/icons';

import type { AgentEmailComposeCardPayload } from '../types';

type AgentEmailComposeCardProps = AgentEmailComposeCardPayload & {
  className?: string;
  onSend?: () => void;
} & Record<string, unknown>;

export function AgentEmailComposeCard(props: AgentEmailComposeCardProps) {
  const to = props.to as string | undefined;
  const subject = props.subject as string | undefined;
  const body = props.body ?? (props.preview as string | undefined);
  const status = props.status ?? 'draft';

  return (
    <SectionCard
      className={props.className}
      title={subject ?? 'Email draft'}
      meta={to ? `To: ${to}` : undefined}
      actions={
        <Badge variant={status === 'sent' ? 'success' : status === 'ready' ? 'info' : 'secondary'}>
          {status}
        </Badge>
      }
    >
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <EmailIcon size={16} />
        Compose email
      </div>
      {body ? (
        <p className="whitespace-pre-wrap rounded-md border border-border/60 bg-muted/20 p-3 text-sm">
          {body}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">No draft content yet.</p>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" size="sm" disabled={status === 'sent'}>
          Edit draft
        </Button>
        <Button size="sm" disabled={status === 'sent'} onClick={props.onSend}>
          <ForwardIcon size={14} className="mr-1.5" />
          Send
        </Button>
      </div>
    </SectionCard>
  );
}

export default AgentEmailComposeCard;

export function normalizeEmailComposeProps(
  props: Record<string, unknown>,
): AgentEmailComposeCardPayload {
  if (props.kind === 'email-compose') return props as AgentEmailComposeCardPayload;
  return {
    kind: 'email-compose',
    to: props.to as string | undefined,
    subject: props.subject as string | undefined,
    body: (props.body ?? props.preview) as string | undefined,
    status: props.status as AgentEmailComposeCardPayload['status'],
  };
}
