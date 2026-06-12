import { Badge, Button, cn, CopyButton } from '@oktavius/base-ui';
import { useState } from 'react';

import { ChevronDownIcon, ChevronUpIcon, SpinnerIcon } from '@/lib/icons';

import type { AgentPythonExecutionCardPayload } from '../types';

type AgentPythonExecutionCardProps = AgentPythonExecutionCardPayload & {
  className?: string;
};

export function AgentPythonExecutionCard({
  summary,
  code,
  status,
  output,
  error,
  className,
}: AgentPythonExecutionCardProps) {
  const [expanded, setExpanded] = useState(status === 'running');

  const statusVariant =
    status === 'running' ? 'info' : status === 'error' ? 'destructive' : 'success';

  return (
    <div className={cn('rounded-card border border-border/60 bg-muted/20 p-3 text-sm', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{summary}</p>
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
        {code ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            aria-label={expanded ? 'Collapse code' : 'Expand code'}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
          </Button>
        ) : null}
      </div>

      {expanded && code ? (
        <div className="relative mt-3">
          <CopyButton value={code} label="Copy code" className="absolute right-2 top-2 z-10" />
          <pre className="overflow-x-auto rounded-control bg-card px-3 py-2 text-xs text-foreground">
            {code}
          </pre>
        </div>
      ) : null}

      {status !== 'running' && (output || error) ? (
        <pre
          className={cn(
            'mt-3 overflow-x-auto rounded-control px-3 py-2 text-xs',
            error ? 'bg-destructive/5 text-destructive' : 'bg-card text-foreground',
          )}
        >
          {error ?? output}
        </pre>
      ) : null}
    </div>
  );
}
