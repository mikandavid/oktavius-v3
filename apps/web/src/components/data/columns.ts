import type { BadgeProps } from '@oktavius/base-ui';

import type { CrudColumn } from './CrudTable';

export function statusColumn<T extends Record<string, unknown>>(
  key: string,
  header: string,
  variantMap: Record<string, BadgeProps['variant']>,
  options?: Pick<CrudColumn<T>, 'sortable' | 'hideBelow'>,
): CrudColumn<T> {
  return {
    key,
    header,
    sortable: options?.sortable ?? true,
    hideBelow: options?.hideBelow,
    type: 'status',
    meta: { variantMap },
  };
}
