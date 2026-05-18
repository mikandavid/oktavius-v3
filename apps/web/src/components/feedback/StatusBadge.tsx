import { Badge, type BadgeProps } from '@oktavius/base-ui';

const DEFAULT_STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
  Active: 'success',
  Pending: 'warning',
  Suspended: 'destructive',
  Completed: 'success',
  Processing: 'info',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  variantMap?: Record<string, BadgeProps['variant']>;
}

export function StatusBadge({ status, label, variantMap }: StatusBadgeProps) {
  const map = variantMap ?? DEFAULT_STATUS_VARIANTS;
  return <Badge variant={map[status] ?? 'secondary'}>{label ?? status}</Badge>;
}
