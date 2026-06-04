import { Link } from 'react-router-dom';

import type { ReactNode } from 'react';

import { Button, InlineEmptyState, ListRow, SectionCard } from '@oktavius/base-ui';

export type RelatedRecordItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  trailing?: ReactNode;
};

type RelatedRecordsPanelProps = {
  title: string;
  records: RelatedRecordItem[];
  emptyLabel?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
};

export function RelatedRecordsPanel({
  title,
  records,
  emptyLabel = 'No related records yet.',
  viewAllHref,
  viewAllLabel = 'View all',
  onAdd,
  addLabel = 'Add',
  className,
}: RelatedRecordsPanelProps) {
  const actions = (
    <div className="flex items-center gap-2">
      {viewAllHref ? (
        <Link
          to={viewAllHref}
          className="inline-flex h-8 items-center rounded-control px-3 text-sm font-medium text-foreground hover:bg-muted/40"
        >
          {viewAllLabel}
        </Link>
      ) : null}
      {onAdd ? (
        <Button size="sm" variant="outline" onClick={onAdd}>
          {addLabel}
        </Button>
      ) : null}
    </div>
  );

  return (
    <SectionCard
      title={title}
      actions={records.length > 0 ? actions : onAdd ? actions : undefined}
      className={className}
    >
      {records.length === 0 ? (
        <InlineEmptyState text={emptyLabel} />
      ) : (
        <div className="divide-y divide-border/50">
          {records.slice(0, 5).map((record) => (
            <Link key={record.id} to={record.href} className="block no-underline">
              <ListRow title={record.title} subtitle={record.subtitle} trailing={record.trailing} />
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
