import { cn } from '@oktavius/base-ui';

import { GridIcon, ListIcon } from '@/lib/icons';

import type { StorageDisplayMode } from '../data/types';

export function StorageViewToggle({
  mode,
  onChange,
}: {
  mode: StorageDisplayMode;
  onChange: (mode: StorageDisplayMode) => void;
}) {
  return (
    <div className="flex h-9 items-center rounded-control bg-muted p-0.5" role="tablist">
      {(['list', 'grid'] as const).map((value) => {
        const Icon = value === 'grid' ? GridIcon : ListIcon;
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={value}
            onClick={() => onChange(value)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-[7px]',
              active ? 'bg-card text-foreground shadow-elevated' : 'text-muted-foreground',
            )}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
