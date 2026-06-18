import {
  Avatar,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oktavius/base-ui';
import { useNavigate } from 'react-router-dom';

import { ChevronDownIcon, SettingsIcon, SignOutIcon, UserIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import {
  LanguageMenuSection,
  OrganizationMenuSection,
  ThemeMenuSection,
} from './AccountMenuSections';

type HeaderAccountMenuProps = {
  compact?: boolean;
  className?: string;
};

export function HeaderAccountMenu({ compact = false, className }: HeaderAccountMenuProps) {
  const navigate = useNavigate();
  const osirisRuntime = useOptionalOsirisRuntime();

  const currentUser = osirisRuntime?.currentUser?.id ? osirisRuntime.currentUser : null;
  if (!currentUser) {
    return null;
  }

  const activeOrgId = osirisRuntime?.activeOrgId ?? null;
  const organizations = osirisRuntime?.organizations ?? [];
  const userLabel = currentUser.fullName ?? currentUser.email ?? 'User';
  const activeOrg = organizations.find((org) => org.id === activeOrgId) ?? organizations[0];
  const setActiveOrgId = osirisRuntime?.setActiveOrgId;
  const switchOrganization = setActiveOrgId
    ? (orgId: string) => {
        void Promise.resolve(setActiveOrgId(orgId)).catch((error: unknown) => {
          appToast.fromApiError(error, 'Organization could not be switched.');
        });
      }
    : undefined;
  const signOut = osirisRuntime?.signOut;
  const handleSignOut = signOut
    ? () => {
        void signOut().catch((error: unknown) => {
          appToast.fromApiError(error, 'Sign out failed.');
        });
      }
    : undefined;

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
          aria-label={`Account menu, ${userLabel}`}
        >
          <Avatar
            label={userLabel}
            size="sm"
            tone="muted"
            icon={<UserIcon size={14} weight="duotone" />}
          />
          {!compact ? (
            <>
              <span className="max-w-[8rem] truncate text-sm font-medium text-foreground">
                {userLabel}
              </span>
              <ChevronDownIcon size={14} className="text-muted-foreground" />
            </>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Avatar
            label={userLabel}
            size="md"
            tone="muted"
            icon={<UserIcon size={16} weight="duotone" />}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight text-foreground">
              {userLabel}
            </p>
            <p className="truncate text-xs leading-tight text-muted-foreground">
              {currentUser.email ?? 'No email'}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => navigate('/settings?section=account')} className="gap-2">
          <UserIcon size={14} />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => navigate('/settings')} className="gap-2">
          <SettingsIcon size={14} />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="px-2 pb-1 pt-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Preferences
        </div>
        <ThemeMenuSection />
        <LanguageMenuSection />
        <OrganizationMenuSection
          activeOrgId={activeOrg?.id ?? activeOrgId}
          organizations={organizations}
          onSelectOrg={switchOrganization}
        />

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={!handleSignOut}
          onSelect={(event) => {
            if (!handleSignOut) {
              event.preventDefault();
              return;
            }
            handleSignOut();
          }}
          className="gap-2"
        >
          <SignOutIcon size={14} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
