import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oktavius/base-ui';

import { ChevronDownIcon } from '@/lib/icons';

export type ConnectedAccountHeaderItem = {
  id: string;
  primaryLabel: string;
  secondaryLabel: string;
};

export type ConnectedAccountsHeaderMenuProps = {
  connectedLabel: string;
  menuHint: string;
  ariaLabel: string;
  items: ConnectedAccountHeaderItem[];
  activeAccountId: string;
  onSelectAccount: (id: string) => void | Promise<void>;
  settingsLabel?: string;
  onOpenSettings?: () => void;
  align?: 'start' | 'end';
  className?: string;
};

export function ConnectedAccountsHeaderMenu({
  connectedLabel,
  menuHint,
  ariaLabel,
  items,
  activeAccountId,
  onSelectAccount,
  settingsLabel,
  onOpenSettings,
  align = 'end',
  className,
}: ConnectedAccountsHeaderMenuProps) {
  const showSettings = Boolean(settingsLabel && onOpenSettings);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          className={cn(
            'max-w-full gap-1.5 border-0 bg-success text-success-foreground shadow-none',
            'hover:bg-success/90 active:bg-success/85 data-[state=open]:bg-success/90',
            'focus-visible:ring-success/40',
            className,
          )}
          aria-label={ariaLabel}
          aria-haspopup="menu"
        >
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-foreground/45 [animation-duration:2.2s]" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success-foreground" />
          </span>
          <span className="truncate opacity-95">{connectedLabel}</span>
          <ChevronDownIcon className="shrink-0 opacity-90" size={16} aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-80">
        <div className="px-2 py-1.5 text-xs font-normal text-muted-foreground">{menuHint}</div>
        <DropdownMenuRadioGroup
          value={activeAccountId}
          onValueChange={(id) => {
            void onSelectAccount(id);
          }}
        >
          {items.map((item) => (
            <DropdownMenuRadioItem key={item.id} value={item.id} className="items-start gap-0 py-2">
              <div className="flex min-w-0 flex-col gap-0.5 pl-0.5">
                <span className="break-words font-medium leading-snug">{item.primaryLabel}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {item.secondaryLabel}
                </span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {showSettings ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                window.setTimeout(() => onOpenSettings?.(), 0);
              }}
            >
              {settingsLabel}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function hostedNylasProviderLabel(provider: unknown): string {
  const key = typeof provider === 'string' ? provider.toLowerCase() : '';
  if (key === 'google') return 'Google';
  if (key === 'microsoft') return 'Microsoft';
  if (key === 'ews') return 'Exchange Server';
  return 'Email sync';
}
