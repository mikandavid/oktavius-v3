import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVertical } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

import { cn } from '../lib/utils';
import { InlineEmptyState } from './inline-empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

export interface SettingsTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface SettingsTableProps<T> {
  columns: SettingsTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** When set, rows can be drag-reordered via the leading handle. Emits the new id order.
   *  Use for user-managed picker lists (payment terms, case types). Skip for alphabetical catalogs. */
  onReorder?: (orderedIds: string[]) => void;
  reorderHandleLabel?: string;
  emptyMessage?: string;
  className?: string;
}

function SortableSettingsRow<T>({
  row,
  rowId,
  columns,
  onRowClick,
  reorderHandleLabel,
}: {
  row: T;
  rowId: string;
  columns: SettingsTableColumn<T>[];
  onRowClick?: (row: T) => void;
  reorderHandleLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowId,
  });

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        onRowClick && 'cursor-pointer',
        isDragging && 'relative z-10 bg-muted/40 shadow-sm',
      )}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
    >
      <TableCell className="w-10 px-2">
        <button
          type="button"
          className="flex h-8 w-8 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label={reorderHandleLabel}
          title={reorderHandleLabel}
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <DotsSixVertical size={16} aria-hidden />
        </button>
      </TableCell>
      {columns.map((column) => (
        <TableCell key={column.key} className={column.className}>
          {column.cell(row)}
        </TableCell>
      ))}
    </TableRow>
  );
}

/**
 * Compact settings/catalog table — lighter than CrudTable, for admin config rows.
 * Pass `onReorder` to enable drag-and-drop ordering (sort order is persisted by the caller).
 */
export function SettingsTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  onReorder,
  reorderHandleLabel = 'Drag to reorder',
  emptyMessage = 'No entries yet',
  className,
}: SettingsTableProps<T>) {
  const rowIds = rows.map(getRowId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rowIds.indexOf(String(active.id));
    const newIndex = rowIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(rowIds, oldIndex, newIndex));
  };

  if (!rows.length) {
    return <InlineEmptyState text={emptyMessage} centered className="border-0 bg-transparent" />;
  }

  const table = (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {onReorder ? (
            <TableHead className="w-10 px-2">
              <span className="sr-only">{reorderHandleLabel}</span>
            </TableHead>
          ) : null}
          {columns.map((column) => (
            <TableHead key={column.key} className={column.headerClassName}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {onReorder
          ? rows.map((row) => {
              const rowId = getRowId(row);
              return (
                <SortableSettingsRow
                  key={rowId}
                  row={row}
                  rowId={rowId}
                  columns={columns}
                  onRowClick={onRowClick}
                  reorderHandleLabel={reorderHandleLabel}
                />
              );
            })
          : rows.map((row) => (
              <TableRow
                key={getRowId(row)}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );

  return (
    <div className={cn('overflow-hidden rounded-control border border-border/50', className)}>
      {onReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            {table}
          </SortableContext>
        </DndContext>
      ) : (
        table
      )}
    </div>
  );
}
