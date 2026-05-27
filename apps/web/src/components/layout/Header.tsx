import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ConnectedAccountsHeaderMenu,
  hostedNylasProviderLabel,
} from '@/components/common/ConnectedAccountsHeaderMenu';
import { ActiveLocationInfoButton } from '@/components/layout/ActiveLocationInfoButton';
import { ActiveLocationPicker } from '@/components/layout/ActiveLocationPicker';
import { useCommandPalette } from '@/components/command/CommandPalette';
import { Button, Input } from '@oktavius/base-ui';

import { SearchIcon } from '@/lib/icons';
import { toast } from '@/lib/toast';

import { HeaderAccountMenu } from './HeaderAccountMenu';
import { NotificationPanel } from './NotificationPanel';

const DEMO_CONNECTED_ACCOUNTS = [
  {
    id: 'acct_google',
    primaryLabel: 'anna.hofer@apex.at',
    secondaryLabel: hostedNylasProviderLabel('google'),
  },
  {
    id: 'acct_microsoft',
    primaryLabel: 'anna.hofer@outlook.com',
    secondaryLabel: hostedNylasProviderLabel('microsoft'),
  },
];

export function Header() {
  const navigate = useNavigate();
  const { setOpen } = useCommandPalette();
  const [activeAccountId, setActiveAccountId] = useState(DEMO_CONNECTED_ACCOUNTS[0]?.id ?? '');

  const activeAccount =
    DEMO_CONNECTED_ACCOUNTS.find((account) => account.id === activeAccountId) ??
    DEMO_CONNECTED_ACCOUNTS[0];

  return (
    <header className="shrink-0 border-b border-border/60 bg-card">
      <div className="flex h-12 items-center gap-3 px-4 md:px-6">
        <div className="hidden items-center gap-2 lg:flex">
          <ActiveLocationPicker />
          <ActiveLocationInfoButton />
        </div>

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
          <div className="hidden xl:block">
            {activeAccount ? (
              <ConnectedAccountsHeaderMenu
                connectedLabel="Calendar synced"
                menuHint="Choose which connected account to use"
                ariaLabel="Connected calendar accounts"
                items={DEMO_CONNECTED_ACCOUNTS}
                activeAccountId={activeAccount.id}
                onSelectAccount={(id) => {
                  setActiveAccountId(id);
                  toast.success('Active calendar account updated.');
                }}
                settingsLabel="Calendar sync settings"
                onOpenSettings={() => navigate('/settings')}
              />
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open command palette"
            onClick={() => setOpen(true)}
          >
            <SearchIcon size={18} />
          </Button>
          <div className="lg:hidden">
            <ActiveLocationInfoButton />
          </div>
          <NotificationPanel />
          <HeaderAccountMenu />
        </div>
      </div>
    </header>
  );
}
