export type DemoBusinessContact = {
  id: string;
  name: string;
  email?: string | null;
};

const DEMO_BUSINESS_CONTACTS: DemoBusinessContact[] = [
  { id: 'biz_1', name: 'Apex Technologies GmbH', email: 'contact@apex-tech.test' },
  { id: 'biz_2', name: 'Donau Logistics AG', email: 'ops@donau-logistics.test' },
  { id: 'biz_3', name: 'Bruckner & Partner KG', email: 'eva@bruckner.test' },
  { id: 'biz_4', name: 'Alpine Services GmbH', email: 'office@alpine-services.test' },
  { id: 'biz_5', name: 'West Region Branch', email: 'ops@west.example' },
];

export function searchDemoBusinessContacts(query: string): DemoBusinessContact[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return DEMO_BUSINESS_CONTACTS.slice(0, 20);
  return DEMO_BUSINESS_CONTACTS.filter(
    (contact) =>
      contact.name.toLowerCase().includes(normalized) ||
      contact.email?.toLowerCase().includes(normalized),
  );
}
