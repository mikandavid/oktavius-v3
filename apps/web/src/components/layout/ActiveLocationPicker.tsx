import { Combobox, cn } from '@oktavius/base-ui';

import { getDemoLocationOptions } from '@/lib/locations/demoLocations';
import { useActiveLocation } from '@/lib/locations/ActiveLocationContext';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

type ActiveLocationPickerProps = {
  className?: string;
};

export function ActiveLocationPicker({ className }: ActiveLocationPickerProps) {
  const osirisRuntime = useOptionalOsirisRuntime();
  const { activeLocationId, viewAllLocations, setActiveLocationId, setAllLocationsMode } =
    useActiveLocation();
  const sites = osirisRuntime?.locationAccess?.sites ?? [];

  const osirisOptions = [
    ...(osirisRuntime?.locationAccess?.canViewAllSites
      ? [{ value: '__all__', label: 'All locations', description: 'No site filter' }]
      : []),
    ...sites.map((site) => ({
      value: site.id,
      label: site.name,
      description: site.isActive === false ? 'Inactive site' : undefined,
    })),
  ];

  const demoOptions = [
    { value: '__all__', label: 'All locations', description: 'No site filter' },
    ...getDemoLocationOptions(),
  ];

  const value = osirisRuntime
    ? osirisRuntime.locationAccess?.canViewAllSites && !osirisRuntime.activeSiteId
      ? '__all__'
      : (osirisRuntime.activeSiteId ?? undefined)
    : viewAllLocations
      ? '__all__'
      : (activeLocationId ?? undefined);

  return (
    <Combobox
      value={value}
      onChange={(next) => {
        if (osirisRuntime) return;
        if (!next || next === '__all__') {
          setAllLocationsMode();
          return;
        }
        setActiveLocationId(next);
      }}
      options={osirisRuntime ? osirisOptions : demoOptions}
      placeholder="Select location"
      disabled={Boolean(osirisRuntime)}
      className={cn('w-[min(12rem,40vw)]', className)}
      aria-label="Active location"
    />
  );
}
