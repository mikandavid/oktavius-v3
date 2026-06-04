import { useState } from 'react';

import { Badge, Button, cn } from '@oktavius/base-ui';

import { CheckIcon, CloseIcon, SpinnerIcon, WarningIcon } from '@/lib/icons';

import type { AgentConfirmationPayload, AgentConfirmationStatus } from './types';

export interface AgentConfirmationCardProps {
  confirmation: AgentConfirmationPayload;
  onRespond?: (approved: boolean) => void | Promise<void>;
  className?: string;
}

type CardState = AgentConfirmationStatus | 'submitting';

const toneClass: Record<CardState, string> = {
  pending: 'border-warning/30 bg-warning/5',
  submitting: 'border-border/60 bg-muted/30',
  approved: 'border-success/30 bg-success/5',
  rejected: 'border-destructive/30 bg-destructive/5',
};

/** Approval card for destructive or sensitive agent actions. */
export function AgentConfirmationCard({
  confirmation,
  onRespond,
  className,
}: AgentConfirmationCardProps) {
  const [state, setState] = useState<CardState>(confirmation.status);

  const isResolved = state === 'approved' || state === 'rejected';

  const respond = async (approved: boolean) => {
    setState('submitting');
    try {
      await onRespond?.(approved);
      setState(approved ? 'approved' : 'rejected');
    } catch {
      setState('pending');
    }
  };

  return (
    <div className={cn('rounded-card border p-3 text-sm', toneClass[state], className)}>
      <div className="flex items-start gap-2">
        <WarningIcon size={16} className="mt-0.5 shrink-0 text-warning" weight="fill" />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="font-medium text-foreground">{confirmation.action}</p>
            <p className="mt-1 text-muted-foreground">{confirmation.description}</p>
          </div>

          {confirmation.details && Object.keys(confirmation.details).length > 0 ? (
            <dl className="space-y-1 rounded-control bg-card/70 px-2.5 py-2 text-xs">
              {Object.entries(confirmation.details).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[minmax(0,8rem)_1fr] gap-2">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="truncate font-medium text-foreground">{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {state === 'pending' ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="cta" size="sm" onClick={() => void respond(true)}>
                Approve
              </Button>
              <Button variant="outline" size="sm" onClick={() => void respond(false)}>
                Reject
              </Button>
            </div>
          ) : null}

          {state === 'submitting' ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <SpinnerIcon size={14} className="animate-spin" />
              Submitting response…
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
