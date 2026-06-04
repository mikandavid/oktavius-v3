import { EntityPicker, type EntityPickerValue } from '@/components/pickers/EntityPicker';
import { useDemoData } from '@/app/demo-data';

export type ContactPickerValue = EntityPickerValue;

type ContactPickerProps = {
  value: ContactPickerValue | null;
  onChange: (value: ContactPickerValue | null) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
};

/** Search contacts/parties from the active demo dataset. */
export function ContactPicker({
  value,
  onChange,
  disabled = false,
  id,
  placeholder = 'Search contacts…',
}: ContactPickerProps) {
  const { parties, clients } = useDemoData();

  const searchEntities = async (query: string): Promise<ContactPickerValue[]> => {
    const normalized = query.trim().toLowerCase();
    const partyItems = parties.map((party) => ({
      id: party.id,
      label: party.name,
      description: party.role,
    }));
    const clientItems = clients.map((client) => ({
      id: `client_${client.id}`,
      label: client.name,
      description: `${client.city} · Client`,
    }));

    const merged = [...partyItems, ...clientItems];
    if (!normalized) return merged.slice(0, 8);
    return merged
      .filter(
        (item) =>
          item.label.toLowerCase().includes(normalized) ||
          item.description?.toLowerCase().includes(normalized),
      )
      .slice(0, 8);
  };

  return (
    <EntityPicker
      id={id}
      value={value}
      onChange={onChange}
      searchEntities={searchEntities}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

export function SingleContactPicker(props: ContactPickerProps) {
  return <ContactPicker {...props} />;
}
