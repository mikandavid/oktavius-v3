import { Button, buttonVariants, cn, MouseTooltip } from '@oktavius/base-ui';
import { Link } from 'react-router-dom';

import { useCommandPalette } from '@/components/command/CommandPalette';
import { APP_SHELL_BORDER_CLASS, APP_SHELL_SURFACE_CLASS } from '@/components/common/pageChrome';
import { BotIcon, ListIcon } from '@/lib/icons';
import { useOrgProfile } from '@/lib/org-profiles/useOrgProfile';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { BrandMark } from './BrandMark';
import { HeaderAccountMenu } from './HeaderAccountMenu';

type MobileTopBarProps = {
  onToggleSidebar: () => void;
  /** When false (e.g. on /ai-chat), hide the link to full-page chat. */
  showChatLink?: boolean;
};

export function MobileTopBar({ onToggleSidebar, showChatLink = true }: MobileTopBarProps) {
  const { setOpen } = useCommandPalette();
  const osirisRuntime = useOptionalOsirisRuntime();
  const profile = useOrgProfile();
  const brandTitle = profile.brandTitle ?? 'Oktavius ERP';
  const activeOrgId = osirisRuntime?.activeOrgId ?? null;
  const activeOrganization = osirisRuntime?.organizations.find((org) => org.id === activeOrgId);
  const activeOrganizationLogoUrl =
    osirisRuntime?.config?.org.logoUrl ?? activeOrganization?.logoUrl ?? null;

  return (
    <div
      className={cn(
        'flex h-12 shrink-0 items-center border-b px-3 md:hidden',
        APP_SHELL_BORDER_CLASS,
        APP_SHELL_SURFACE_CLASS,
      )}
    >
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label="Toggle navigation">
        <ListIcon size={18} />
      </Button>
      <div className="ml-2 flex min-w-0 items-center gap-2">
        <BrandMark logoUrl={activeOrganizationLogoUrl} />
        <span className="truncate text-sm font-semibold">{brandTitle}</span>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          aria-label="Open command palette"
          onClick={() => setOpen(true)}
        >
          Search
        </Button>
        {showChatLink ? (
          <MouseTooltip content="Open agent chat">
            <Link
              to="/ai-chat"
              aria-label="Open agent chat"
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
            >
              <BotIcon size={18} />
            </Link>
          </MouseTooltip>
        ) : null}
        <HeaderAccountMenu compact />
      </div>
    </div>
  );
}
