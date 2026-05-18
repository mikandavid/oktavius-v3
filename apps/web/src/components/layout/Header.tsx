import { Button, Input } from '@oktavius/base-ui';

import { NotificationsIcon, SearchIcon } from '@/lib/icons';

import { HeaderAccountMenu } from './HeaderAccountMenu';

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="flex h-12 items-center gap-3 px-4 md:px-6">
        <div className="relative hidden w-full max-w-md md:block">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            className="pl-9"
            name="workspace-search"
            aria-label="Search modules, records, and commands"
            autoComplete="off"
            placeholder="Search modules, records, commands…"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <NotificationsIcon size={18} />
          </Button>
          <HeaderAccountMenu />
        </div>
      </div>
    </header>
  );
}
