import type { MultiSelectOption } from '@oktavius/base-ui';

/**
 * Location-ownable data modules offered in the "org-shared modules" picker.
 * Mirrors the generated CRUD module set (see tools/module-generator) — kept as a
 * runtime constant because `tools/` is build-time only and not importable here.
 * Values already saved that aren't listed still render (MultiSelect shows their
 * raw id), so legacy/back-end-only module ids are never silently dropped.
 */
export const SHARED_MODULE_OPTIONS: MultiSelectOption[] = [
  { value: 'clients', label: 'Clients' },
  { value: 'products', label: 'Products' },
  { value: 'cases', label: 'Cases' },
  { value: 'users', label: 'Users' },
  { value: 'orders', label: 'Orders' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'incidents', label: 'Incidents' },
  { value: 'projects', label: 'Projects' },
];
