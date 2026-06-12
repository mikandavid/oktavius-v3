import { useOptionalApiRegistry } from '@/api/ApiProvider';
import { EntityPicker, type EntityPickerValue } from '@/components/pickers/EntityPicker';

export type ContactPickerValue = EntityPickerValue;

type ContactPickerProps = {
  value: ContactPickerValue | null;
  onChange: (value: ContactPickerValue | null) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
};

function stringField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function contactLabel(record: Record<string, unknown>) {
  const firstName = stringField(record, 'firstName');
  const lastName = stringField(record, 'lastName');
  return [firstName, lastName].filter(Boolean).join(' ') || stringField(record, 'name');
}

function contactDescription(record: Record<string, unknown>) {
  return [
    stringField(record, 'role'),
    stringField(record, 'email'),
    stringField(record, 'clientName'),
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Search contacts and clients from the configured API registry. */
export function ContactPicker({
  value,
  onChange,
  disabled = false,
  id,
  placeholder = 'Search contacts…',
}: ContactPickerProps) {
  const api = useOptionalApiRegistry();

  const searchEntities = async (query: string): Promise<ContactPickerValue[]> => {
    if (!api) return [];

    const [contacts, clients] = await Promise.all([
      api.contacts.list({ pageSize: '6', search: query }),
      api.clients.list({ pageSize: '2', search: query }),
    ]);

    return [
      ...contacts.data.map((contact) => ({
        id: stringField(contact, 'id'),
        label: contactLabel(contact),
        description: contactDescription(contact),
      })),
      ...clients.data.map((client) => ({
        id: `client_${stringField(client, 'id')}`,
        label: stringField(client, 'name'),
        description: [stringField(client, 'city'), 'Client'].filter(Boolean).join(' · '),
      })),
    ].filter((item) => item.id && item.label);
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
