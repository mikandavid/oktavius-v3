import { Combobox, cn } from '@oktavius/base-ui';

import { getDemoLocationOptions } from '@/lib/locations/demoLocations';
import { useActiveLocation } from '@/lib/locations/ActiveLocationContext';

type ActiveLocationPickerProps = {
  className?: string;
};

export function ActiveLocationPicker({ className }: ActiveLocationPickerProps) {
  const { activeLocationId, viewAllLocations, setActiveLocationId, setAllLocationsMode } =
    useActiveLocation();

  const options = [
    { value: '__all__', label: 'All locations', description: 'No site filter' },
    ...getDemoLocationOptions(),
  ];

  const value = viewAllLocations ? '__all__' : (activeLocationId ?? undefined);

  return (
    <Combobox
      value={value}
      onChange={(next) => {
        if (!next || next === '__all__') {
          setAllLocationsMode();
          return;
        }
        setActiveLocationId(next);
      }}
      options={options}
      placeholder="Select location"
      className={cn('w-[min(12rem,40vw)]', className)}
      aria-label="Active location"
    />
  );
}
