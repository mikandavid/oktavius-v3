import type { ComboboxOption } from '@oktavius/base-ui';

import type { LocationDetailItem } from './types';

export const DEMO_LOCATIONS: LocationDetailItem[] = [
  {
    id: 'loc_vienna',
    name: 'Vienna HQ',
    isActive: true,
    branchCode: 'VIE-01',
    designation: 'Head office',
    locality: 'Vienna',
    category: 'Office',
    phone: '+43 1 234 5678',
    mobilePhone: null,
    fax: null,
    companyName: 'Apex Technologies GmbH',
    email: 'office.vienna@apex-tech.test',
    street: 'Mariahilfer Straße 88',
    postalCode: '1070',
  },
  {
    id: 'loc_graz',
    name: 'Graz office',
    isActive: true,
    branchCode: 'GRZ-01',
    designation: 'Regional office',
    locality: 'Graz',
    category: 'Office',
    phone: '+43 316 987 654',
    mobilePhone: null,
    fax: null,
    companyName: 'Apex Technologies GmbH',
    email: 'office.graz@apex-tech.test',
    street: 'Herrengasse 16',
    postalCode: '8010',
  },
  {
    id: 'loc_linz',
    name: 'Linz warehouse',
    isActive: true,
    branchCode: 'LNZ-WH',
    designation: 'Logistics',
    locality: 'Linz',
    category: 'Warehouse',
    phone: '+43 732 555 010',
    mobilePhone: null,
    fax: null,
    companyName: 'Apex Logistics AT',
    email: 'warehouse@apex-tech.test',
    street: 'Industriestraße 12',
    postalCode: '4020',
  },
];

export function getDemoLocationOptions(): ComboboxOption[] {
  return DEMO_LOCATIONS.map((location) => ({
    value: location.id,
    label: location.name,
    description: location.locality ?? undefined,
  }));
}

export function getDemoLocationById(id: string | null): LocationDetailItem | null {
  if (!id) return null;
  return DEMO_LOCATIONS.find((location) => location.id === id) ?? null;
}
