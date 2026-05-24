import type { ReactNode } from 'react';

import type { Breakpoint } from './gridUtils';

export type ColumnType = 'text' | 'status' | 'date' | 'currency' | 'boolean' | 'badge';

export interface CrudColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  hideBelow?: Breakpoint;
  className?: string;
  type?: ColumnType;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  truncate?: boolean;
  meta?: Record<string, unknown>;
}

export interface CrudRowAction<T> {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: (item: T) => void;
  destructive?: boolean;
  hidden?: (item: T) => boolean;
  confirm?: {
    title: string;
    description?: string;
    actionLabel?: string;
  };
}

export interface BulkAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: (selectedIds: string[]) => void;
  destructive?: boolean;
  minSelection?: number;
  maxSelection?: number;
  confirm?: {
    title: string | ((selectedCount: number) => string);
    description?: string;
    actionLabel?: string;
  };
}
