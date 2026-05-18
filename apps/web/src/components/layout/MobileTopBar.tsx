import { Button } from '@oktavius/base-ui';

import { ListIcon } from '@/lib/icons';

import { HeaderAccountMenu } from './HeaderAccountMenu';
import { BrandMark } from './BrandMark';

type MobileTopBarProps = {
  onToggleSidebar: () => void;
};

export function MobileTopBar({ onToggleSidebar }: MobileTopBarProps) {
  return (
    <div className="flex h-12 items-center border-b px-3 md:hidden">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label="Toggle navigation">
        <ListIcon size={18} />
      </Button>
      <div className="ml-2 flex min-w-0 items-center gap-2">
        <BrandMark />
        <span className="truncate text-sm font-semibold">Oktavius ERP</span>
      </div>
      <HeaderAccountMenu compact className="ml-auto" />
    </div>
  );
}
