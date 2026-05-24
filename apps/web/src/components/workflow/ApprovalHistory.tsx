import { SectionCard, Timeline, type TimelineEvent } from '@oktavius/base-ui';

export type ApprovalHistoryStatus = 'submitted' | 'approved' | 'rejected' | 'comment';

export interface ApprovalHistoryEntry {
  id: string;
  label: string;
  description?: string;
  timestamp?: string;
  status: ApprovalHistoryStatus;
  actor?: string;
}

const STATUS_TONE: Record<ApprovalHistoryStatus, TimelineEvent['tone']> = {
  submitted: 'info',
  approved: 'success',
  rejected: 'destructive',
  comment: 'default',
};

export interface ApprovalHistoryProps {
  entries: ApprovalHistoryEntry[];
  title?: string;
  meta?: string;
  className?: string;
}

/** Timeline of approval steps for a record or request. */
export function ApprovalHistory({
  entries,
  title = 'Approval history',
  meta,
  className,
}: ApprovalHistoryProps) {
  const events: TimelineEvent[] = entries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    description: entry.description ?? entry.actor,
    timestamp: entry.timestamp,
    tone: STATUS_TONE[entry.status],
  }));

  return (
    <SectionCard title={title} meta={meta} className={className}>
      <Timeline events={events} />
    </SectionCard>
  );
}
