import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, type ReactNode } from 'react';

import { cn, interactiveSurfaceClasses } from '../lib/utils';
import { InlineEmptyState } from './inline-empty-state';
import { SectionCard } from './section-card';

export interface KanbanColumn<T> {
  id: string;
  title: string;
  items: T[];
  /** Shown in column header meta slot, e.g. "3 items" */
  meta?: ReactNode;
}

export interface KanbanMoveEvent {
  itemId: string;
  fromColumnId: string;
  toColumnId: string;
  newIndex: number;
}

export interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  getItemId: (item: T) => string;
  renderCard: (item: T, column: KanbanColumn<T>) => ReactNode;
  onCardClick?: (item: T, column: KanbanColumn<T>) => void;
  /** When set, cards can be dragged between columns (and reordered within a column). */
  onMove?: (move: KanbanMoveEvent) => void;
  emptyLabel?: string;
  className?: string;
  columnClassName?: string;
}

/** Apply a kanban move to a column list — useful in module state updaters. */
export function applyKanbanMove<T>(
  columns: KanbanColumn<T>[],
  getItemId: (item: T) => string,
  move: KanbanMoveEvent,
): KanbanColumn<T>[] {
  const { itemId, fromColumnId, toColumnId, newIndex } = move;
  let movedItem: T | undefined;

  const withoutItem = columns.map((column) => {
    if (column.id !== fromColumnId) return column;
    const items = column.items.filter((item) => {
      if (getItemId(item) === itemId) {
        movedItem = item;
        return false;
      }
      return true;
    });
    return { ...column, items };
  });

  if (!movedItem) return columns;

  return withoutItem.map((column) => {
    if (column.id !== toColumnId) return column;
    const items = [...column.items];
    const insertAt = Math.max(0, Math.min(newIndex, items.length));
    items.splice(insertAt, 0, movedItem as T);
    return { ...column, items };
  });
}

function resolveColumnId<T>(
  targetId: string,
  columns: KanbanColumn<T>[],
  getItemId: (item: T) => string,
): string | null {
  if (columns.some((column) => column.id === targetId)) return targetId;
  for (const column of columns) {
    if (column.items.some((item) => getItemId(item) === targetId)) {
      return column.id;
    }
  }
  return null;
}

function resolveInsertIndex<T>(
  targetId: string,
  column: KanbanColumn<T>,
  getItemId: (item: T) => string,
): number {
  if (column.id === targetId) return column.items.length;
  const overIndex = column.items.findIndex((item) => getItemId(item) === targetId);
  return overIndex >= 0 ? overIndex : column.items.length;
}

function KanbanColumnDropZone({
  columnId,
  children,
  enabled,
}: {
  columnId: string;
  children: ReactNode;
  enabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    disabled: !enabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[4rem] rounded-control transition-colors',
        enabled && isOver && 'bg-muted/40 ring-2 ring-inset ring-ring/25',
      )}
    >
      {children}
    </div>
  );
}

function SortableKanbanCard({
  id,
  enabled,
  onClick,
  children,
}: {
  id: string;
  enabled: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !enabled,
  });

  const style = enabled
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : undefined;

  if (!enabled) {
    if (!onClick) return <div>{children}</div>;
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full text-left',
          interactiveSurfaceClasses,
          'rounded-control outline-none focus-visible:ring-offset-2',
        )}
      >
        {children}
      </button>
    );
  }

  const cardContent = onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-control text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        interactiveSurfaceClasses,
      )}
    >
      {children}
    </button>
  ) : (
    children
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'touch-none rounded-control outline-none',
        isDragging && 'opacity-40',
        !onClick && interactiveSurfaceClasses,
      )}
      {...attributes}
      {...listeners}
    >
      {cardContent}
    </div>
  );
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
  onMove,
  emptyLabel = 'No items',
  className,
  columnClassName,
}: KanbanBoardProps<T>) {
  const draggable = Boolean(onMove);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeItem = activeId
    ? columns
        .flatMap((column) => column.items.map((item) => ({ item, column })))
        .find((entry) => getItemId(entry.item) === activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    if (!onMove) return;

    const { active, over } = event;
    if (!over) return;

    const itemId = String(active.id);
    const overId = String(over.id);
    if (itemId === overId) return;

    const fromColumn = columns.find((column) =>
      column.items.some((item) => getItemId(item) === itemId),
    );
    if (!fromColumn) return;

    const toColumnId = resolveColumnId(overId, columns, getItemId);
    if (!toColumnId) return;

    const toColumn = columns.find((column) => column.id === toColumnId);
    if (!toColumn) return;

    const fromIndex = fromColumn.items.findIndex((item) => getItemId(item) === itemId);
    let newIndex = resolveInsertIndex(overId, toColumn, getItemId);

    if (fromColumn.id === toColumnId && fromIndex >= 0 && newIndex > fromIndex) {
      newIndex -= 1;
    }

    onMove({
      itemId,
      fromColumnId: fromColumn.id,
      toColumnId,
      newIndex,
    });
  };

  const board = (
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
      {columns.map((column) => {
        const itemIds = column.items.map((item) => getItemId(item));
        const columnBody = (
          <KanbanColumnDropZone columnId={column.id} enabled={draggable}>
            <div className="space-y-2">
              {column.items.length ? (
                column.items.map((item) => {
                  const itemId = getItemId(item);
                  return (
                    <SortableKanbanCard
                      key={itemId}
                      id={itemId}
                      enabled={draggable}
                      onClick={onCardClick ? () => onCardClick(item, column) : undefined}
                    >
                      {renderCard(item, column)}
                    </SortableKanbanCard>
                  );
                })
              ) : (
                <InlineEmptyState
                  text={emptyLabel}
                  className="border-0 bg-transparent py-8 text-center"
                />
              )}
            </div>
          </KanbanColumnDropZone>
        );

        return (
          <SectionCard
            key={column.id}
            title={column.title}
            meta={column.meta ?? `${column.items.length} items`}
            className={cn('min-h-[320px]', columnClassName)}
          >
            {draggable ? (
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                {columnBody}
              </SortableContext>
            ) : (
              columnBody
            )}
          </SectionCard>
        );
      })}
    </div>
  );

  if (!draggable) return board;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {board}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
        {activeItem ? (
          <div className="cursor-grabbing rounded-control bg-card shadow-elevated ring-1 ring-border/60">
            {renderCard(activeItem.item, activeItem.column)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
