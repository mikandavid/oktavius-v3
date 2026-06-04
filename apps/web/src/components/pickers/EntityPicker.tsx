import { useRef } from 'react';

import { Combobox, type ComboboxOption } from '@oktavius/base-ui';

export type EntityPickerValue = {
  id: string;
  label: string;
  description?: string;
};

export type EntityPickerProps = {
  value: EntityPickerValue | null;
  onChange: (value: EntityPickerValue | null) => void;
  searchEntities: (query: string) => Promise<EntityPickerValue[]>;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  onCreate?: {
    label: string;
    placeholder?: string;
    onSubmit: (label: string) => Promise<EntityPickerValue | null>;
  };
};

function toComboboxOptions(items: EntityPickerValue[]): ComboboxOption[] {
  return items.map((item) => ({
    value: item.id,
    label: item.label,
    description: item.description,
  }));
}

/** Generic async entity picker — wraps Combobox for related-record selection. */
export function EntityPicker({
  value,
  onChange,
  searchEntities,
  placeholder = 'Search records…',
  disabled = false,
  id,
  onCreate,
}: EntityPickerProps) {
  const lastResultsRef = useRef<EntityPickerValue[]>(value ? [value] : []);

  return (
    <Combobox
      id={id}
      value={value?.id}
      placeholder={placeholder}
      disabled={disabled}
      options={value ? toComboboxOptions([value]) : []}
      asyncItems={async (query) => {
        const items = await searchEntities(query);
        lastResultsRef.current = items;
        return toComboboxOptions(items);
      }}
      onChange={(nextId) => {
        if (!nextId) {
          onChange(null);
          return;
        }
        const match =
          lastResultsRef.current.find((item) => item.id === nextId) ??
          (value?.id === nextId ? value : null);
        if (match) onChange(match);
      }}
      onCreate={
        onCreate
          ? {
              label: onCreate.label,
              placeholder: onCreate.placeholder,
              onSubmit: async (label) => {
                const created = await onCreate.onSubmit(label);
                if (!created) return null;
                onChange(created);
                return created.id;
              },
            }
          : undefined
      }
    />
  );
}
