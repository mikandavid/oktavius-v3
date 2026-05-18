import { useNavigate } from 'react-router-dom';

import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@oktavius/base-ui';

import { useDemoData } from '@/app/demo-data';
import { ChevronDownIcon, SettingsIcon, UserIcon, UsersIcon } from '@/lib/icons';

type HeaderAccountMenuProps = {
  compact?: boolean;
  className?: string;
};

export function HeaderAccountMenu({ compact = false, className }: HeaderAccountMenuProps) {
  const navigate = useNavigate();
  const { users } = useDemoData();
  const currentUser = users[0];

  if (!currentUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'h-9 gap-2 rounded-full border border-transparent px-1.5 hover:border-border hover:bg-muted/70',
            compact ? 'w-9 justify-center px-0' : 'pl-1.5 pr-2',
            className,
          )}
          aria-label="Open account menu"
        >
          <Avatar label={currentUser.name} size="sm" tone="muted" />
          {!compact ? (
            <>
              <span className="max-w-[8rem] truncate text-sm font-medium text-foreground">
                {currentUser.name}
              </span>
              <ChevronDownIcon size={14} className="text-muted-foreground" />
            </>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-2">
          <div className="text-sm font-medium text-foreground">{currentUser.name}</div>
          <div className="truncate text-xs text-muted-foreground">{currentUser.email}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {currentUser.role} · {currentUser.team}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate(`/users/${currentUser.id}`)} className="gap-2">
          <UserIcon size={14} />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/users')} className="gap-2">
          <UsersIcon size={14} />
          Team members
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/showcase')} className="gap-2">
          <SettingsIcon size={14} />
          Interface settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
