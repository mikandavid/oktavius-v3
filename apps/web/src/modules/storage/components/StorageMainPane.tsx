import { cn } from '@oktavius/base-ui';

import type { StorageViewState } from '../useStorageViewState';

export function StorageMainPane({
  state,
  className,
}: {
  state: StorageViewState;
  className?: string;
}) {
  void state;
  return <section className={cn('flex flex-col', className)} data-testid="storage-main" />;
}
