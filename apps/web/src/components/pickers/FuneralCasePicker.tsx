import { useMemo } from 'react';

import { Combobox, cn } from '@oktavius/base-ui';

import {
  searchDemoFuneralCases,
  toFuneralCasePickerValue,
  type FuneralCasePickerValue,
} from '@/lib/pickers/demoFuneralCases';
import { useActiveLocation } from '@/lib/locations/ActiveLocationContext';

export type { FuneralCasePickerValue };

type FuneralCasePickerProps = {
  value: FuneralCasePickerValue | null;
  onChange: (value: FuneralCasePickerValue | null) => void;
  disabled?: boolean;
  triggerClassName?: string;
  id?: string;
};

const UNASSIGNED_VALUE = '__unassigned__';

/** Vertical-specific case picker — filters demo funeral cases by active location when set. */
export function FuneralCasePicker({
  value,
  onChange,
  disabled = false,
  triggerClassName,
  id,
}: FuneralCasePickerProps) {
  const { activeLocationId, viewAllLocations } = useActiveLocation();

  const options = useMemo(() => {
    const cases = searchDemoFuneralCases('', viewAllLocations ? null : activeLocationId);
    return [
      { value: UNASSIGNED_VALUE, label: 'No case linked', description: 'Clear selection' },
      ...cases.map((item) => {
        const pickerValue = toFuneralCasePickerValue(item);
        return {
          value: item.id,
          label: pickerValue.deceasedName,
          description: pickerValue.caseNumber,
        };
      }),
    ];
  }, [activeLocationId, viewAllLocations]);

  return (
    <Combobox
      id={id}
      disabled={disabled}
      value={value?.id ?? UNASSIGNED_VALUE}
      options={options}
      placeholder="Search by case number or name…"
      className={cn('w-full max-w-md', triggerClassName)}
      asyncItems={async (query) => {
        const cases = searchDemoFuneralCases(query, viewAllLocations ? null : activeLocationId);
        return [
          { value: UNASSIGNED_VALUE, label: 'No case linked', description: 'Clear selection' },
          ...cases.map((item) => {
            const pickerValue = toFuneralCasePickerValue(item);
            return {
              value: item.id,
              label: pickerValue.deceasedName,
              description: pickerValue.caseNumber,
            };
          }),
        ];
      }}
      onChange={(next) => {
        if (!next || next === UNASSIGNED_VALUE) {
          onChange(null);
          return;
        }
        const match = searchDemoFuneralCases('', viewAllLocations ? null : activeLocationId).find(
          (item) => item.id === next,
        );
        if (match) {
          onChange(toFuneralCasePickerValue(match));
        }
      }}
    />
  );
}
