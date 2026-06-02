import type { ReactNode } from 'react';

import type { PermissionRequirement } from '@/lib/permissions';

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
  /** Hide this generated/list column unless the active subject satisfies the requirement. */
  permission?: PermissionRequirement;
  meta?: Record<string, unknown>;
}

export interface CrudRowAction<T> {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: (item: T) => void | Promise<void>;
  destructive?: boolean;
  /** Hide this custom row action unless the active subject satisfies the requirement. */
  permission?: PermissionRequirement;
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
  onClick: (selectedIds: string[]) => void | Promise<void>;
  destructive?: boolean;
  /** Hide this custom bulk action unless the active subject satisfies the requirement. */
  permission?: PermissionRequirement;
  minSelection?: number;
  maxSelection?: number;
  confirm?: {
    title: string | ((selectedCount: number) => string);
    description?: string;
    actionLabel?: string;
  };
}
