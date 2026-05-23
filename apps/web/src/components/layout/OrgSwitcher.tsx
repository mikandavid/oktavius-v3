import { Link } from 'react-router-dom';

import { DropdownMenuItem, DropdownMenuSeparator } from '@oktavius/base-ui';

import { useDemoData } from '@/app/demo-data';
import { CheckIcon, OrganizationIcon } from '@/lib/icons';

/** Organization picker block — embed inside the profile/account dropdown only. */
export function OrganizationMenuSection() {
  const { organizations } = useDemoData();
  const activeOrg = organizations[0];

  return (
    <>
      <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Organization
      </p>
      {organizations.slice(0, 5).map((org) => (
        <DropdownMenuItem key={org.id} className="flex items-start gap-2 py-2" asChild>
          <Link to={`/superadmin/orgs/${org.id}`}>
            <OrganizationIcon size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{org.name}</p>
              <p className="text-xs text-muted-foreground">{org.environment}</p>
            </div>
            {org.id === activeOrg?.id ? (
              <CheckIcon size={14} weight="bold" className="shrink-0 text-cta" />
            ) : null}
          </Link>
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/superadmin" className="text-muted-foreground">
          Manage organizations…
        </Link>
      </DropdownMenuItem>
    </>
  );
}
