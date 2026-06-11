import { Combobox, cn } from '@oktavius/base-ui';

import { useActiveLocation } from '@/lib/locations/ActiveLocationContext';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

type ActiveLocationPickerProps = {
  className?: string;
};

export function shouldShowActiveLocationPicker({
  activeOrgId,
  locationAccess,
}: {
  activeOrgId: string | null | undefined;
  locationAccess:
    | {
        orgSiteCount?: number;
        sites: readonly { id: string }[];
        canViewAllSites?: boolean;
      }
    | null
    | undefined;
}) {
  if (!activeOrgId) return false;
  const orgSiteCount = locationAccess?.orgSiteCount ?? 0;
  if (orgSiteCount < 2) return false;
  const sites = locationAccess?.sites ?? [];
  const canViewAllSites = locationAccess?.canViewAllSites ?? false;
  return sites.length > 1 || canViewAllSites;
}

export function ActiveLocationPicker({ className }: ActiveLocationPickerProps) {
  const osirisRuntime = useOptionalOsirisRuntime();
  const {
    activeLocationId,
    viewAllLocations,
    setActiveLocationId,
    setAllLocationsMode,
    locations,
  } = useActiveLocation();
  const canViewAllSites = osirisRuntime?.locationAccess?.canViewAllSites ?? false;

  if (
    !shouldShowActiveLocationPicker({
      activeOrgId: osirisRuntime?.activeOrgId,
      locationAccess: osirisRuntime?.locationAccess,
    })
  ) {
    return null;
  }

  const options = [
    ...(canViewAllSites
      ? [{ value: '__all__', label: 'All locations', description: 'No site filter' }]
      : []),
    ...locations.map((location) => ({
      value: location.id,
      label: location.name,
      description: location.isActive === false ? 'Inactive site' : undefined,
    })),
  ];

  const value = canViewAllSites && viewAllLocations ? '__all__' : (activeLocationId ?? undefined);

  return (
    <Combobox
      value={value}
      onChange={(next) => {
        if (!next) return;
        if (next === '__all__') {
          if (!canViewAllSites) return;
          setAllLocationsMode();
          return;
        }
        setActiveLocationId(next);
      }}
      options={options}
      placeholder="Select location"
      disabled={options.length === 0}
      className={cn('w-[min(12rem,40vw)]', className)}
      aria-label="Active location"
    />
  );
}
