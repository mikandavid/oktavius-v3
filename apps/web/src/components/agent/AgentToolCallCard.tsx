import { useState } from 'react';

import { Badge, Button, cn } from '@oktavius/base-ui';

import { ChevronDownIcon, ChevronUpIcon, SpinnerIcon } from '@/lib/icons';

export interface AgentToolCallCardProps {
  toolName: string;
  input?: Record<string, unknown>;
  result?: string;
  status?: 'running' | 'completed' | 'failed';
  className?: string;
}

function formatToolName(toolName: string) {
  return toolName
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Collapsible card for agent tool invocation input/output. */
export function AgentToolCallCard({
  toolName,
  input,
  result,
  status = 'completed',
  className,
}: AgentToolCallCardProps) {
  const [expanded, setExpanded] = useState(status === 'running');

  const statusVariant =
    status === 'running' ? 'info' : status === 'failed' ? 'destructive' : 'secondary';

  return (
    <div className={cn('rounded-card border border-border/60 bg-muted/20 p-3 text-sm', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{formatToolName(toolName)}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={statusVariant}>
              {status === 'running' ? (
                <span className="inline-flex items-center gap-1">
                  <SpinnerIcon size={12} className="animate-spin" />
                  Running
                </span>
              ) : (
                status
              )}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          aria-label={expanded ? 'Collapse tool details' : 'Expand tool details'}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
        </Button>
      </div>

      {expanded ? (
        <div className="mt-3 space-y-2">
          {input && Object.keys(input).length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Input
              </p>
              <pre className="overflow-x-auto rounded-control bg-card px-2.5 py-2 text-xs text-foreground">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          ) : null}
          {result ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Result
              </p>
              <pre className="overflow-x-auto rounded-control bg-card px-2.5 py-2 text-xs text-foreground">
                {result}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
