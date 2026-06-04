import type { BadgeProps } from '@oktavius/base-ui';

/** Shared task status map for embedded task lists on detail pages. */
export const TASK_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  Pending: 'warning',
  Active: 'success',
  Completed: 'success',
};
