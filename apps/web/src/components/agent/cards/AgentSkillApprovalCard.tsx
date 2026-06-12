import { Badge, Button, cn } from '@oktavius/base-ui';
import { useState } from 'react';

import { CheckIcon, CloseIcon, SpinnerIcon, WarningIcon } from '@/lib/icons';

import type { AgentSkillApprovalCardPayload } from '../types';

type AgentSkillApprovalCardProps = AgentSkillApprovalCardPayload & {
  onRespond?: (approved: boolean) => void | Promise<void>;
  className?: string;
};

export function AgentSkillApprovalCard({
  title,
  summary,
  skillKey,
  fields = [],
  status,
  onRespond,
  className,
}: AgentSkillApprovalCardProps) {
  const [state, setState] = useState(status);
  const isResolved = state === 'approved' || state === 'rejected';

  const respond = async (approved: boolean) => {
    setState('pending');
    try {
      await onRespond?.(approved);
      setState(approved ? 'approved' : 'rejected');
    } catch {
      setState('pending');
    }
  };

  return (
    <div
      className={cn(
        'rounded-card border p-3 text-sm',
        state === 'approved'
          ? 'border-success/30 bg-success/5'
          : state === 'rejected'
            ? 'border-destructive/30 bg-destructive/5'
            : 'border-warning/30 bg-warning/5',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <WarningIcon size={16} className="mt-0.5 shrink-0 text-warning" weight="fill" />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{title}</p>
              {skillKey ? <Badge variant="secondary">{skillKey}</Badge> : null}
            </div>
            <p className="mt-1 text-muted-foreground">{summary}</p>
          </div>

          {fields.length > 0 ? (
            <dl className="space-y-1 rounded-control bg-card/70 px-2.5 py-2 text-xs">
              {fields.map((field) => (
                <div key={field.label} className="grid grid-cols-[minmax(0,8rem)_1fr] gap-2">
                  <dt className="text-muted-foreground">{field.label}</dt>
                  <dd className="font-medium text-foreground">
                    {field.value}
                    {field.confidence !== undefined ? (
                      <span className="ml-2 text-muted-foreground">
                        ({Math.round(field.confidence * 100)}%)
                      </span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {!isResolved ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="cta" size="sm" onClick={() => void respond(true)}>
                Approve
              </Button>
              <Button variant="outline" size="sm" onClick={() => void respond(false)}>
                Reject
              </Button>
            </div>
          ) : null}

          {state === 'pending' && onRespond ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <SpinnerIcon size={14} className="animate-spin" />
              Submitting…
            </div>
          ) : null}

          {isResolved ? (
            <Badge variant={state === 'approved' ? 'success' : 'destructive'}>
              {state === 'approved' ? (
                <span className="inline-flex items-center gap-1">
                  <CheckIcon size={12} /> Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <CloseIcon size={12} /> Rejected
                </span>
              )}
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}
