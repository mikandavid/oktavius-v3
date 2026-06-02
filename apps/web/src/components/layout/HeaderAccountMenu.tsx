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
import { ChevronDownIcon, SettingsIcon, SignOutIcon, UserIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import {
  DesignMenuSection,
  LanguageMenuSection,
  OrganizationMenuSection,
} from './AccountMenuSections';

type HeaderAccountMenuProps = {
  compact?: boolean;
  className?: string;
};

export function HeaderAccountMenu({ compact = false, className }: HeaderAccountMenuProps) {
  const navigate = useNavigate();
  const { getUserOrganizations, activeOrgId, organizations, currentUser } = useDemoData();

  if (!currentUser) {
    return null;
  }

  const userOrgs = getUserOrganizations(currentUser.id);
  const activeOrg =
    userOrgs.find((org) => org.id === activeOrgId) ??
    organizations.find((org) => org.id === activeOrgId) ??
    userOrgs[0];

  const handleSignOut = () => {
    appToast.info('Signed out (demo)');
    navigate('/dashboard');
  };

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
          aria-label={`Account menu, ${currentUser.name}`}
        >
          <Avatar
            label={currentUser.name}
            size="sm"
            tone="muted"
            icon={<UserIcon size={14} weight="duotone" />}
          />
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

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem
          onSelect={() => navigate('/profile')}
          className="h-auto flex-col items-start gap-0.5 px-2 py-2 font-normal focus:bg-muted/50"
        >
          <span className="text-sm font-medium leading-tight text-foreground">
            {currentUser.name}
          </span>
          <span className="w-full truncate text-xs leading-tight text-muted-foreground">
            {currentUser.email}
          </span>
          {activeOrg ? (
            <span className="w-full truncate text-xs leading-tight text-muted-foreground/80">
              {activeOrg.name} · {activeOrg.environment}
            </span>
          ) : (
            <span className="text-xs leading-tight text-muted-foreground/80">
              {currentUser.role} · {currentUser.team}
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => navigate('/settings')} className="gap-2">
          <SettingsIcon size={14} />
          Settings
        </DropdownMenuItem>
        <OrganizationMenuSection userId={currentUser.id} />
        <LanguageMenuSection />
        <DesignMenuSection />

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={handleSignOut} className="gap-2">
          <SignOutIcon size={14} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
