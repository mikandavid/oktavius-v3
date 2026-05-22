import { DropdownMenuItem, DropdownMenuSeparator } from '@oktavius/base-ui';

import { CheckIcon, OrganizationIcon } from '@/lib/icons';

const DEMO_ORGS = [
  { id: 'org_apex', name: 'Apex Technologies GmbH', role: 'Production' },
  { id: 'org_demo', name: 'Oktavius Demo Org', role: 'Sandbox' },
  { id: 'org_west', name: 'West Region Branch', role: 'Trial' },
] as const;

/** Organization picker block — embed inside the profile/account dropdown only. */
export function OrganizationMenuSection() {
  const activeOrg = DEMO_ORGS[0];

  return (
    <>
      <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Organization
      </p>
      {DEMO_ORGS.map((org) => (
        <DropdownMenuItem key={org.id} className="flex items-start gap-2 py-2">
          <OrganizationIcon size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{org.name}</p>
            <p className="text-xs text-muted-foreground">{org.role}</p>
          </div>
          {org.id === activeOrg.id ? (
            <CheckIcon size={14} weight="bold" className="shrink-0 text-cta" />
          ) : null}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-muted-foreground">Manage organizations…</DropdownMenuItem>
    </>
  );
}
