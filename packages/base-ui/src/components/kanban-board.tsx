import type { ReactNode } from 'react';

import { cn } from '../lib/utils';
import { InlineEmptyState } from './inline-empty-state';
import { SectionCard } from './section-card';

export interface KanbanColumn<T> {
  id: string;
  title: string;
  items: T[];
  /** Shown in column header meta slot, e.g. "3 items" */
  meta?: ReactNode;
}

export interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  getItemId: (item: T) => string;
  renderCard: (item: T, column: KanbanColumn<T>) => ReactNode;
  onCardClick?: (item: T, column: KanbanColumn<T>) => void;
  emptyLabel?: string;
  className?: string;
  columnClassName?: string;
}

/**
 * Reusable pipeline board — columns of SectionCards with a vertical card stack.
 * Use for CRM stages, procurement workflow, case boards, etc.
 */
export function KanbanBoard<T>({
  columns,
  getItemId,
  renderCard,
  onCardClick,
  emptyLabel = 'No items',
  className,
  columnClassName,
}: KanbanBoardProps<T>) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns.length >= 4
          ? 'xl:grid-cols-4'
          : columns.length === 3
            ? 'lg:grid-cols-3'
            : 'sm:grid-cols-2',
        className,
      )}
    >
      {columns.map((column) => (
        <SectionCard
          key={column.id}
          title={column.title}
          meta={column.meta ?? `${column.items.length} items`}
          className={cn('min-h-[320px]', columnClassName)}
        >
          <div className="space-y-2">
            {column.items.length ? (
              column.items.map((item) => {
                const card = renderCard(item, column);
                if (!onCardClick) return <div key={getItemId(item)}>{card}</div>;
                return (
                  <div
                    key={getItemId(item)}
                    role="button"
                    tabIndex={0}
                    onClick={() => onCardClick(item, column)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onCardClick(item, column);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {card}
                  </div>
                );
              })
            ) : (
              <InlineEmptyState
                text={emptyLabel}
                className="border-0 bg-transparent py-8 text-center"
              />
            )}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
