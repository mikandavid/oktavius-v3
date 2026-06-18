import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@oktavius/base-ui';
import { cn } from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import { useTranslation } from '@/core/i18n';
import {
  CheckIcon,
  CloseIcon,
  GlobeIcon,
  PlusIcon,
  UsersIcon,
  WhatsAppPolicyIcon as ShieldCheckIcon,
} from '@/lib/icons';
import type { IntegrationGrant } from '@/runtime/osiris/agentIntegrationsClient';

import { removeGrant, toggleGrant } from './connectionPresentation';

// TODO: Replace with real org user/role hooks when available in v3.
// useOrgUsers and useOrgCustomRoles do not exist in this codebase yet.
// Rendering with empty lists — audience chips still work, add-picker shows no members.

const STANDARD_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;

interface ShareAudienceControlProps {
  grants: IntegrationGrant[];
  onChange: (grants: IntegrationGrant[]) => void;
  disabled?: boolean;
}

function grantKey(grant: IntegrationGrant): string {
  return `${grant.subjectType}:${grant.subjectKey}`;
}

/** Inline avatar for member chips — EntityAvatar does not exist in v3 yet. */
function MemberAvatar({ label }: { label: string }) {
  const initials = label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((t) => t.charAt(0).toUpperCase())
    .join('');
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary select-none"
      aria-hidden
    >
      {initials || '·'}
    </span>
  );
}

/**
 * Audience editor for shared connections: selected grantees render as chips and a `+`
 * button opens a searchable popover listing the org, roles, and members — replacing
 * the old comma-separated UUID inputs.
 */
export function ShareAudienceControl({ grants, onChange, disabled }: ShareAudienceControlProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  // TODO: wire real data when useOrgUsers / useOrgCustomRoles are ported to v3.
  const members = useMemo<Array<{ userId: string; fullName: string; email?: string }>>(
    () => [],
    [],
  );
  const customRoles = useMemo<Array<{ id: string; name: string }>>(() => [], []);

  const membersById = useMemo(() => new Map(members.map((user) => [user.userId, user])), [members]);
  const customRolesById = useMemo(
    () => new Map(customRoles.map((role) => [role.id, role])),
    [customRoles],
  );
  const selectedKeys = useMemo(() => new Set(grants.map(grantKey)), [grants]);

  function grantLabel(grant: IntegrationGrant): string {
    if (grant.subjectType === 'all_members') return t('settings.integrationAudienceEveryone');
    if (grant.subjectType === 'role') return t(`settings.integrationRole.${grant.subjectKey}`);
    if (grant.subjectType === 'custom_role') {
      return (
        customRolesById.get(grant.subjectKey)?.name ?? t('settings.integrationAudienceUnknownRole')
      );
    }
    return (
      membersById.get(grant.subjectKey)?.fullName ??
      membersById.get(grant.subjectKey)?.email ??
      t('settings.integrationAudienceUnknownUser')
    );
  }

  function grantIcon(grant: IntegrationGrant) {
    if (grant.subjectType === 'all_members')
      return <GlobeIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />;
    if (grant.subjectType === 'role')
      return <ShieldCheckIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />;
    if (grant.subjectType === 'custom_role')
      return <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />;
    return <MemberAvatar label={grantLabel(grant)} />;
  }

  function selectableItem(grant: IntegrationGrant, label: string, icon: React.ReactNode) {
    const selected = selectedKeys.has(grantKey(grant));
    return (
      <CommandItem
        key={grantKey(grant)}
        value={label}
        onSelect={() => onChange(toggleGrant(grants, grant))}
        className="gap-2"
      >
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <CheckIcon
          className={cn('h-4 w-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')}
          aria-hidden
        />
      </CommandItem>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {grants.length === 0 ? (
        <span className="text-xs text-muted-foreground">
          {t('settings.integrationAudienceOnlyMe')}
        </span>
      ) : null}
      {grants.map((grant) => (
        <span
          key={grantKey(grant)}
          className="inline-flex max-w-56 items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 py-0.5 pl-2 pr-1 text-xs"
        >
          {grantIcon(grant)}
          <span className="truncate">{grantLabel(grant)}</span>
          {disabled ? (
            <span className="w-1" aria-hidden />
          ) : (
            <button
              type="button"
              className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t('settings.integrationAudienceRemove', { name: grantLabel(grant) })}
              onClick={() => onChange(removeGrant(grants, grant))}
            >
              <CloseIcon className="h-3 w-3" aria-hidden />
            </button>
          )}
        </span>
      ))}
      {disabled ? null : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full border-dashed text-muted-foreground hover:text-foreground"
              aria-label={t('settings.integrationAudienceAdd')}
            >
              <PlusIcon className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder={t('settings.integrationAudienceSearch')} />
              <CommandList>
                <CommandEmpty>{t('settings.integrationAudienceNoResults')}</CommandEmpty>
                <CommandGroup>
                  {selectableItem(
                    { subjectType: 'all_members', subjectKey: '*' },
                    t('settings.integrationAudienceEveryone'),
                    <GlobeIcon className="h-4 w-4 text-muted-foreground" aria-hidden />,
                  )}
                </CommandGroup>
                <CommandGroup heading={t('settings.integrationAudienceGroupRoles')}>
                  {STANDARD_ROLES.map((role) =>
                    selectableItem(
                      { subjectType: 'role', subjectKey: role },
                      t(`settings.integrationRole.${role}`),
                      <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" aria-hidden />,
                    ),
                  )}
                  {customRoles.map((role) =>
                    selectableItem(
                      { subjectType: 'custom_role', subjectKey: role.id },
                      role.name,
                      <UsersIcon className="h-4 w-4 text-muted-foreground" aria-hidden />,
                    ),
                  )}
                </CommandGroup>
                <CommandGroup heading={t('settings.integrationAudienceGroupPeople')}>
                  {members.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-muted-foreground">
                      {t('settings.integrationAudienceNoResults')}
                    </div>
                  ) : null}
                  {members.map((member) => {
                    const grant: IntegrationGrant = {
                      subjectType: 'user',
                      subjectKey: member.userId,
                    };
                    const selected = selectedKeys.has(grantKey(grant));
                    return (
                      <CommandItem
                        key={member.userId}
                        value={`${member.fullName} ${member.email ?? ''}`}
                        onSelect={() => onChange(toggleGrant(grants, grant))}
                        className="gap-2"
                      >
                        <MemberAvatar label={member.fullName} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{member.fullName}</span>
                          {member.email ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              {member.email}
                            </span>
                          ) : null}
                        </span>
                        <CheckIcon
                          className={cn('h-4 w-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')}
                          aria-hidden
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
