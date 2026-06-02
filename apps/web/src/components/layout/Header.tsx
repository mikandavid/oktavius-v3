import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ConnectedAccountsHeaderMenu,
  hostedNylasProviderLabel,
} from '@/components/common/ConnectedAccountsHeaderMenu';
import { useCommandPalette } from '@/components/command/CommandPalette';
import { cn } from '@oktavius/base-ui';

import { APP_SHELL_SURFACE_CLASS } from '@/components/common/pageChrome';
import { appToast } from '@/lib/toast';

import { HeaderAccountMenu } from './HeaderAccountMenu';
import { NotificationPanel } from './NotificationPanel';

const COMMAND_PALETTE_TRIGGER_CLASS =
  'hidden h-9 w-full min-w-0 max-w-xs items-center rounded-control bg-muted/60 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:flex lg:max-w-sm';

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
                  appToast.success('Active calendar account updated.');
                }}
                settingsLabel="Calendar sync settings"
                onOpenSettings={() => navigate('/settings')}
              />
            ) : null}
          </div>
          <NotificationPanel />
          <HeaderAccountMenu compact />
        </div>
      </div>
    </header>
  );
}
