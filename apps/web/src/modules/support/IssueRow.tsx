// IssueRow — one ticket rendered GitHub-issue style. Thin wrapper over base-ui ListRow.
import { Badge, ListRow, RelativeTime, StatusDot } from '@oktavius/base-ui';

import { SuccessIcon } from '@/lib/icons';

import { PRIORITY_VARIANT, type TicketRow } from './shared';

interface IssueRowProps {
  row: TicketRow;
  onClick: (id: string) => void;
}

export function IssueRow({ row, onClick }: IssueRowProps) {
  const shortId = row.id.slice(0, 6);
  const isClosed = row.statusGroup === 'closed';

  const leading = isClosed ? (
    <SuccessIcon size={18} weight="fill" className="text-success" aria-hidden />
  ) : (
    <StatusDot tone="info" size="md" />
  );

  const meta = (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="tabular-nums">#{shortId}</span>
      <span aria-hidden>·</span>
      <span>{row.requester}</span>
      <span aria-hidden>·</span>
      <RelativeTime date={row.updatedAt} />
    </span>
  );

  const trailing = (
    <span className="flex shrink-0 items-center gap-1.5">
      <Badge variant={PRIORITY_VARIANT[row.priority] ?? 'secondary'}>{row.priorityLabel}</Badge>
      <Badge variant="outline">{row.categoryLabel}</Badge>
    </span>
  );

  return (
    <ListRow
      variant="queue"
      leading={leading}
      title={row.subject}
      meta={meta}
      trailing={trailing}
      onClick={() => onClick(row.id)}
    />
  );
}
