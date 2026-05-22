import { Link } from 'react-router-dom';

import { Button, buttonVariants, cn } from '@oktavius/base-ui';

import { BotIcon, ListIcon } from '@/lib/icons';

import { HeaderAccountMenu } from './HeaderAccountMenu';
import { BrandMark } from './BrandMark';

type MobileTopBarProps = {
  onToggleSidebar: () => void;
  /** When false (e.g. on /ai-chat), hide the link to full-page chat. */
  showChatLink?: boolean;
};

export function MobileTopBar({ onToggleSidebar, showChatLink = true }: MobileTopBarProps) {
  return (
    <div className="flex h-12 shrink-0 items-center border-b border-border/60 bg-card px-3 md:hidden">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label="Toggle navigation">
        <ListIcon size={18} />
      </Button>
      <div className="ml-2 flex min-w-0 items-center gap-2">
        <BrandMark />
        <span className="truncate text-sm font-semibold">Oktavius ERP</span>
      </div>
      <div className="ml-auto flex items-center gap-1">
        {showChatLink ? (
          <Link
            to="/ai-chat"
            aria-label="Open agent chat"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
          >
            <BotIcon size={18} />
          </Link>
        ) : null}
        <HeaderAccountMenu compact />
      </div>
    </div>
  );
}
