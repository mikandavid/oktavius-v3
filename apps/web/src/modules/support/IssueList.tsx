// IssueList — renders issue rows with empty state + pagination. Presentation only;
// the caller owns data + useListPageState wiring.
import { InlineEmptyState } from '@oktavius/base-ui';

import { Pagination } from '@/components/data/Pagination';

import { IssueRow } from './IssueRow';
import type { TicketRow } from './shared';

interface IssueListProps {
  rows: TicketRow[];
  isLoading: boolean;
  emptyText: string;
  onOpenTicket: (id: string) => void;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isUnread?: (row: TicketRow) => boolean;
}

export function IssueList({
  rows,
  isLoading,
  emptyText,
  onOpenTicket,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  isUnread,
}: IssueListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-px">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-control bg-muted/40" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <InlineEmptyState text={emptyText} centered />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        {rows.map((row) => (
          <IssueRow
            key={row.id}
            row={row}
            onClick={onOpenTicket}
            unread={isUnread?.(row) ?? false}
          />
        ))}
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
