import type { BadgeProps } from '@oktavius/base-ui';

export { emailPageIcon } from '@/lib/modulePageIcons';

export const EMAIL_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  Unread: 'info',
  Linked: 'success',
  Draft: 'warning',
  Failed: 'destructive',
  Sent: 'secondary',
};
