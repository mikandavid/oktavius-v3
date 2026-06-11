import { useMemo } from 'react';

import { Combobox, cn } from '@oktavius/base-ui';

export type FuneralCasePickerValue = {
  id: string;
  caseNumber: string;
  deceasedName: string;
};

type FuneralCasePickerProps = {
  value: FuneralCasePickerValue | null;
  onChange: (value: FuneralCasePickerValue | null) => void;
  disabled?: boolean;
  triggerClassName?: string;
  id?: string;
};

const UNASSIGNED_VALUE = '__unassigned__';

export function FuneralCasePicker({
  value,
  onChange,
  disabled = false,
  triggerClassName,
  id,
}: FuneralCasePickerProps) {
  const options = useMemo(() => {
    return [
      { value: UNASSIGNED_VALUE, label: 'No case linked', description: 'Clear selection' },
      ...(value
        ? [
            {
              value: value.id,
              label: value.deceasedName,
              description: value.caseNumber,
            },
          ]
        : []),
    ];
  }, [value]);

  return (
    <Combobox
      id={id}
      disabled={disabled}
      value={value?.id ?? UNASSIGNED_VALUE}
      options={options}
      placeholder="Search by case number or name…"
      className={cn('w-full max-w-md', triggerClassName)}
      asyncItems={async () => options}
      onChange={(next) => {
        if (!next || next === UNASSIGNED_VALUE) {
          onChange(null);
          return;
        }
        if (value && next === value.id) {
          onChange(value);
        }
      }}
    />
  );
}
