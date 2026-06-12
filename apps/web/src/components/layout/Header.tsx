import { cn } from '@oktavius/base-ui';

import { useCommandPalette } from '@/components/command/CommandPalette';
import { APP_SHELL_SURFACE_CLASS } from '@/components/common/pageChrome';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { HeaderAccountMenu } from './HeaderAccountMenu';
import { NotificationPanel } from './NotificationPanel';

const COMMAND_PALETTE_TRIGGER_CLASS =
  'hidden h-9 w-full min-w-0 max-w-xs items-center rounded-control bg-muted/60 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:flex lg:max-w-sm';

export function Header() {
  const { setOpen } = useCommandPalette();
  const osirisRuntime = useOptionalOsirisRuntime();

  return (
    <header className={cn('shrink-0', APP_SHELL_SURFACE_CLASS)}>
      <div className="flex h-12 items-center gap-3 px-4 md:px-6">
        <button
          type="button"
          className={COMMAND_PALETTE_TRIGGER_CLASS}
          aria-label="Open command palette"
          onClick={() => setOpen(true)}
        >
          <span className="truncate">Search modules, records, commands…</span>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <NotificationPanel runtime={osirisRuntime?.notificationsRuntime} />
          <HeaderAccountMenu compact />
        </div>
      </div>
    </header>
  );
}
