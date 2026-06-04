import { EntityPicker, type EntityPickerValue } from '@/components/pickers/EntityPicker';
import {
  searchDemoBusinessContacts,
  type DemoBusinessContact,
} from '@/lib/pickers/demoBusinessContacts';

export type BusinessContactPickerValue = {
  id: string;
  name: string;
  email?: string | null;
};

type BusinessContactPickerProps = {
  value: BusinessContactPickerValue | null;
  onChange: (value: BusinessContactPickerValue | null) => void;
  disabled?: boolean;
  id?: string;
};

function toPickerValue(contact: DemoBusinessContact): EntityPickerValue {
  return {
    id: contact.id,
    label: contact.name,
    description: contact.email ?? undefined,
  };
}

/** Async combobox for business (company) contacts — demo search over static data. */
export function BusinessContactPicker({
  value,
  onChange,
  disabled = false,
  id,
}: BusinessContactPickerProps) {
  return (
    <EntityPicker
      id={id}
      disabled={disabled}
      placeholder="Search business contacts…"
      value={value ? toPickerValue(value) : null}
      onChange={(next) => {
        if (!next) {
          onChange(null);
          return;
        }
        onChange({
          id: next.id,
          name: next.label,
          email: next.description ?? null,
        });
      }}
      searchEntities={async (query) =>
        searchDemoBusinessContacts(query).map((contact) => toPickerValue(contact))
      }
    />
  );
}
