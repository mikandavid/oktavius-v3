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

import { ChevronDownIcon, SettingsIcon, SignOutIcon, UserIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

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
  const osirisRuntime = useOptionalOsirisRuntime();

  const currentUser = osirisRuntime?.currentUser?.id ? osirisRuntime.currentUser : null;
  if (!currentUser) {
    return null;
  }

  const activeOrgId = osirisRuntime?.activeOrgId ?? null;
  const organizations = osirisRuntime?.organizations ?? [];
  const memberships = osirisRuntime?.memberships ?? [];
  const userLabel = currentUser.fullName ?? currentUser.email ?? 'User';
  const activeOrg = organizations.find((org) => org.id === activeOrgId) ?? organizations[0];
  const activeMembership = memberships.find((membership) => membership.org_id === activeOrg?.id);
  const roleLabel = activeMembership?.role ?? null;
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
        <DropdownMenuItem
          onSelect={() => navigate('/profile')}
          className="h-auto flex-col items-start gap-0.5 px-2 py-2 font-normal focus:bg-muted/50"
        >
          <span className="text-sm font-medium leading-tight text-foreground">{userLabel}</span>
          <span className="w-full truncate text-xs leading-tight text-muted-foreground">
            {currentUser.email ?? 'No email'}
          </span>
          {activeOrg ? (
            <span className="w-full truncate text-xs leading-tight text-muted-foreground/80">
              {activeOrg.name}
              {roleLabel ? ` · ${roleLabel}` : null}
            </span>
          ) : (
            <span className="text-xs leading-tight text-muted-foreground/80">
              {roleLabel ?? 'No active organization'}
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => navigate('/settings')} className="gap-2">
          <SettingsIcon size={14} />
          Settings
        </DropdownMenuItem>
        <OrganizationMenuSection
          activeOrgId={activeOrg?.id ?? activeOrgId}
          organizations={organizations}
          onSelectOrg={switchOrganization}
        />
        <LanguageMenuSection />
        <DesignMenuSection />

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
