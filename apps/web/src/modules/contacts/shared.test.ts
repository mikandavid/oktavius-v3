import { describe, expect, it } from 'vitest';

import type { Contact } from './data/types';
import { contactFilters, contactFormFields, toContactRow } from './shared';

const t = (_key: string, _vars?: unknown, fallback?: string) => fallback ?? _key;

const base: Contact = {
  id: 'c1',
  orgId: 'o1',
  name: 'Maria Huber',
  isBusiness: false,
  email: 'm@h.at',
  phone: '',
  mobile: '',
  fax: '',
  linkedin: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  clientCode: '',
  categoryIds: ['cat1'],
  tags: [],
  notes: '',
  createdAt: '',
  updatedAt: '',
};

describe('contacts shared', () => {
  it('maps a contact to a row with type + category labels', () => {
    const names = new Map([['cat1', 'Primär']]);
    const row = toContactRow(base, t, names);
    expect(row.typeValue).toBe('person');
    expect(row.typeLabel).toBe('Person');
    expect(row.categoryLabel).toBe('Primär');
  });

  it('marks business contacts', () => {
    const row = toContactRow({ ...base, isBusiness: true }, t, new Map());
    expect(row.typeValue).toBe('business');
  });

  it('builds two filters (type + category) with category options from the list', () => {
    const filters = contactFilters(t, [{ id: 'cat1', name: 'Primär' }]);
    expect(filters.map((f) => f.key)).toEqual(['type', 'category']);
    expect(filters[1]!.options).toEqual([{ value: 'cat1', label: 'Primär' }]);
  });

  it('includes a required name field and a multiselect categories field', () => {
    const fields = contactFormFields(t, [{ id: 'cat1', name: 'Primär' }]);
    const name = fields.find((f) => f.name === 'name');
    const categories = fields.find((f) => f.name === 'categoryIds');
    expect(name?.required).toBe(true);
    expect(categories?.type).toBe('multiselect');
  });
});
