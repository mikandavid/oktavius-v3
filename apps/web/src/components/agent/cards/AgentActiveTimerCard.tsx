import { Badge, Button, SectionCard } from '@oktavius/base-ui';

import { StopIcon, TimeIcon } from '@/lib/icons';

import { formatDisplayDateTime } from '@oktavius/base-ui';
import type { AgentActiveTimerCardPayload } from '../types';

type AgentActiveTimerCardProps = AgentActiveTimerCardPayload & {
  className?: string;
  onStop?: () => void;
} & Record<string, unknown>;

function formatElapsed(seconds?: number): string {
  const total = Math.max(0, seconds ?? 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function AgentActiveTimerCard(props: AgentActiveTimerCardProps) {
  const title = (props.title as string | undefined) ?? 'Active timer';
  const project = props.project ?? (props.projectName as string | undefined);
  const client = props.client ?? (props.clientName as string | undefined);
  const elapsedSeconds =
    props.elapsedSeconds ?? (typeof props.elapsed === 'number' ? props.elapsed : undefined) ?? 0;
  const isRunning = props.isRunning ?? props.running !== false;

  return (
    <SectionCard
      className={props.className}
      title={title}
      meta={project ?? client}
      actions={
        isRunning ? (
          <Badge variant="info">
            <TimeIcon size={12} className="mr-1 inline" />
            Running
          </Badge>
        ) : (
          <Badge variant="secondary">Stopped</Badge>
        )
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-2xl font-semibold tabular-nums">
            {formatElapsed(elapsedSeconds)}
          </div>
          {props.startedAt ? (
            <div className="mt-1 text-xs text-muted-foreground">
              Started {formatDisplayDateTime(props.startedAt)}
            </div>
          ) : null}
          {client && project ? (
            <div className="mt-1 text-xs text-muted-foreground">
              {client} · {project}
            </div>
          ) : null}
        </div>
        {isRunning && props.onStop ? (
          <Button variant="outline" size="sm" onClick={props.onStop}>
            <StopIcon size={14} className="mr-1.5" />
            Stop
          </Button>
        ) : null}
      </div>
    </SectionCard>
  );
}

export default AgentActiveTimerCard;

export function normalizeActiveTimerProps(
  props: Record<string, unknown>,
): AgentActiveTimerCardPayload {
  if (props.kind === 'active-timer') return props as AgentActiveTimerCardPayload;
  return {
    kind: 'active-timer',
    title: props.title as string | undefined,
    project: (props.project ?? props.projectName) as string | undefined,
    client: (props.client ?? props.clientName) as string | undefined,
    elapsedSeconds: props.elapsedSeconds as number | undefined,
    startedAt: props.startedAt as string | undefined,
    isRunning: props.isRunning as boolean | undefined,
  };
}
