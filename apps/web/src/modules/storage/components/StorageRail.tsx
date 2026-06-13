import { cn } from '@oktavius/base-ui';

import type { StorageViewState } from '../useStorageViewState';

export function StorageRail({ state, className }: { state: StorageViewState; className?: string }) {
  void state;
  return <aside className={cn('flex-col', className)} data-testid="storage-rail" />;
}
