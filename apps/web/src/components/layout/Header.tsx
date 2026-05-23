import { Button, Input } from '@oktavius/base-ui';

import { useCommandPalette } from '@/components/command/CommandPalette';
import { SearchIcon } from '@/lib/icons';

import { HeaderAccountMenu } from './HeaderAccountMenu';
import { NotificationPanel } from './NotificationPanel';

export function Header() {
  const { setOpen } = useCommandPalette();

  return (
    <header className="shrink-0 border-b border-border/60 bg-card">
      <div className="flex h-12 items-center gap-3 px-4 md:px-6">
        <div className="relative hidden w-full min-w-0 max-w-xs md:block lg:max-w-sm">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            className="cursor-pointer pl-9"
            name="workspace-search"
            aria-label="Open command palette"
            autoComplete="off"
            readOnly
            placeholder="Search modules, records, commands…"
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
            ⌘K
          </kbd>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open command palette"
            onClick={() => setOpen(true)}
          >
            <SearchIcon size={18} />
          </Button>
          <NotificationPanel />
          <HeaderAccountMenu />
        </div>
      </div>
    </header>
  );
}
