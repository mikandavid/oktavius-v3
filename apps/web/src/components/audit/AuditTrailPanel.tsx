import {
  Badge,
  cn,
  CollapsibleSection,
  InlineEmptyState,
  RelativeTime,
  ScrollArea,
} from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import {
  ArrowRightIcon,
  BotIcon,
  DeleteIcon,
  EditIcon,
  PlusIcon,
  SystemThemeIcon,
  UserIcon,
} from '@/lib/icons';

export type AuditChange = {
  field: string;
  oldValue: unknown;
  newValue: unknown;
};

export type AuditEntry = {
  id: string;
  action: 'create' | 'update' | 'delete' | 'send' | 'payment' | string;
  entityType: string;
  entityId: string;
  userName?: string | null;
  source?: 'user' | 'ai' | 'agent' | 'system' | string | null;
  changes?: AuditChange[] | null;
  createdAt: string;
};

type AuditTrailPanelProps = {
  entityType: string;
  entityId: string;
  entries?: AuditEntry[];
  className?: string;
};

const ACTION_LABELS: Record<
  string,
  { label: string; variant: 'success' | 'secondary' | 'destructive' | 'outline' | 'default' }
> = {
  create: { label: 'Created', variant: 'success' },
  update: { label: 'Updated', variant: 'secondary' },
  delete: { label: 'Deleted', variant: 'destructive' },
  send: { label: 'Sent', variant: 'default' },
  payment: { label: 'Payment', variant: 'success' },
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function SourceAvatar({ source, userName }: { source?: string | null; userName?: string | null }) {
  if (source === 'ai' || source === 'agent') {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <BotIcon size={14} />
      </div>
    );
  }
  if (source === 'system') {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SystemThemeIcon size={14} />
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      {userName ? (
        <span className="text-[10px] font-medium uppercase">
          {userName
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)}
        </span>
      ) : (
        <UserIcon size={14} />
      )}
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const config = ACTION_LABELS[action] ?? { label: action, variant: 'outline' as const };
  const Icon =
    action === 'create'
      ? PlusIcon
      : action === 'update'
        ? EditIcon
        : action === 'delete'
          ? DeleteIcon
          : SystemThemeIcon;

  return (
    <Badge variant={config.variant} className="gap-1 text-[10px]">
      <Icon size={12} />
      {config.label}
    </Badge>
  );
}

function AuditEntryRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasChanges = Boolean(entry.changes?.length);
  const actorLabel =
    entry.source === 'ai' || entry.source === 'agent'
      ? 'AI Agent'
      : entry.source === 'system'
        ? 'System'
        : entry.userName || 'User';

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        type="button"
        className={cn(
          'flex w-full items-start gap-3 px-1 py-3 text-left transition-colors hover:bg-muted/30',
          hasChanges ? 'cursor-pointer' : 'cursor-default',
        )}
        disabled={!hasChanges}
        onClick={() => hasChanges && setExpanded((current) => !current)}
      >
        <SourceAvatar source={entry.source} userName={entry.userName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{actorLabel}</span>
            <ActionBadge action={entry.action} />
          </div>
          <RelativeTime date={entry.createdAt} className="mt-0.5 text-xs text-muted-foreground" />
        </div>
      </button>
      {hasChanges && expanded ? (
        <div className="space-y-1 pb-3 pl-10">
          {entry.changes!.map((change, index) => (
            <div
              key={`${change.field}-${index}`}
              className="flex flex-wrap items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-xs"
            >
              <span className="font-medium text-muted-foreground">{change.field}</span>
              <span className="truncate text-destructive/80 line-through">
                {formatValue(change.oldValue)}
              </span>
              <ArrowRightIcon size={12} className="shrink-0 text-muted-foreground" />
              <span className="truncate font-medium text-foreground">
                {formatValue(change.newValue)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AuditTrailPanel({ entries, className }: AuditTrailPanelProps) {
  const resolvedEntries = useMemo(() => entries ?? [], [entries]);

  return (
    <CollapsibleSection title="Change history" className={className}>
      {resolvedEntries.length === 0 ? (
        <InlineEmptyState text="No history recorded yet." />
      ) : (
        <ScrollArea className="max-h-[24rem]">
          <div className="pr-2">
            {resolvedEntries.map((entry) => (
              <AuditEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        </ScrollArea>
      )}
    </CollapsibleSection>
  );
}
