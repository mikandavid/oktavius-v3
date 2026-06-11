import { useState } from 'react';

import type { SettingsTableColumn } from '@oktavius/base-ui';

import { StatusBadge } from '@/components/feedback/StatusBadge';
import { type FormField, type FormFieldValue } from '@/components/forms/EntityForm';
import { CatalogBlockManager, nextSortOrder } from '@/components/settings/CatalogBlockManager';
import { appToast } from '@/lib/toast';

import { ShowcaseBlock } from '../shared';

type ShowcaseCatalogRow = {
  id: string;
  label: string;
  code: string;
  active: boolean;
  sortOrder?: number;
};

const statusVariantMap = {
  Active: 'success',
  Inactive: 'secondary',
} as const;

const catalogColumns: SettingsTableColumn<ShowcaseCatalogRow>[] = [
  {
    key: 'label',
    header: 'Label',
    cell: (row) => <span className="font-medium text-foreground">{row.label}</span>,
  },
  {
    key: 'code',
    header: 'Code',
    cell: (row) => <span className="text-muted-foreground">{row.code}</span>,
  },
  {
    key: 'active',
    header: 'Status',
    cell: (row) => (
      <StatusBadge status={row.active ? 'Active' : 'Inactive'} variantMap={statusVariantMap} />
    ),
  },
];

const catalogFields: FormField[] = [
  { name: 'label', label: 'Label', type: 'text', required: true },
  { name: 'code', label: 'Code', type: 'text', required: true },
  { name: 'active', label: 'Active', type: 'switch' },
];

function emptyValues(): Record<string, FormFieldValue> {
  return { label: '', code: '', active: true };
}

function toFormValues(row: ShowcaseCatalogRow): Record<string, FormFieldValue> {
  return {
    label: row.label,
    code: row.code,
    active: row.active,
  };
}

function fromFormValues(
  values: Record<string, FormFieldValue>,
  id: string,
  rows: ShowcaseCatalogRow[],
  editingRow: ShowcaseCatalogRow | null,
  orderable: boolean,
): ShowcaseCatalogRow {
  return {
    id,
    label: String(values.label ?? '').trim(),
    code: String(values.code ?? '').trim(),
    active: Boolean(values.active),
    sortOrder: orderable ? (editingRow?.sortOrder ?? nextSortOrder(rows)) : undefined,
  };
}

function upsertRow(row: ShowcaseCatalogRow, rows: ShowcaseCatalogRow[]) {
  const exists = rows.some((candidate) => candidate.id === row.id);
  return exists
    ? rows.map((candidate) => (candidate.id === row.id ? row : candidate))
    : [...rows, row];
}

export function SettingsShowcaseSection() {
  const [countries, setCountries] = useState<ShowcaseCatalogRow[]>([
    { id: 'country_at', label: 'Austria', code: 'AT', active: true, sortOrder: 1 },
    { id: 'country_de', label: 'Germany', code: 'DE', active: true, sortOrder: 2 },
    { id: 'country_ch', label: 'Switzerland', code: 'CH', active: true, sortOrder: 3 },
  ]);
  const [currencies, setCurrencies] = useState<ShowcaseCatalogRow[]>([
    { id: 'currency_eur', label: 'Euro', code: 'EUR', active: true, sortOrder: 1 },
    { id: 'currency_chf', label: 'Swiss franc', code: 'CHF', active: true, sortOrder: 2 },
    { id: 'currency_usd', label: 'US dollar', code: 'USD', active: false, sortOrder: 3 },
  ]);
  const [paymentTerms, setPaymentTerms] = useState<ShowcaseCatalogRow[]>([
    { id: 'term_net30', label: 'Net 30', code: 'NET30', active: true, sortOrder: 1 },
    { id: 'term_net14', label: 'Net 14', code: 'NET14', active: true, sortOrder: 2 },
    { id: 'term_due', label: 'Due on receipt', code: 'DUE', active: true, sortOrder: 3 },
  ]);

  const renderBlock = (
    title: string,
    description: string,
    rows: ShowcaseCatalogRow[],
    setRows: (rows: ShowcaseCatalogRow[]) => void,
  ) => (
    <CatalogBlockManager<ShowcaseCatalogRow>
      title={title}
      description={description}
      rows={rows}
      columns={catalogColumns}
      formFields={catalogFields}
      emptyValues={emptyValues}
      toFormValues={toFormValues}
      fromFormValues={(values, context) =>
        fromFormValues(values, context.id, rows, context.editingRow, context.orderable)
      }
      orderable
      onCreate={(row) => {
        setRows(upsertRow(row, rows));
        appToast.success(`${title} entry created.`);
      }}
      onUpdate={(_id, row) => {
        setRows(upsertRow(row, rows));
        appToast.success(`${title} entry saved.`);
      }}
      onDelete={(id) => {
        setRows(rows.filter((row) => row.id !== id));
        appToast.success(`${title} entry removed.`);
      }}
      onReorder={setRows}
      getRowLabel={(row) => row.label}
    />
  );

  return (
    <div className="space-y-4">
      <ShowcaseBlock
        title="SettingsPageFactory"
        meta="Section factory · CatalogBlockManager<T> blocks"
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {renderBlock(
            'Countries',
            'Localized country catalog for address and tax forms.',
            countries,
            setCountries,
          )}
          {renderBlock(
            'Currencies',
            'Allowed currencies for commercial documents.',
            currencies,
            setCurrencies,
          )}
          {renderBlock(
            'Payment terms',
            'Reusable payment terms for invoices and orders.',
            paymentTerms,
            setPaymentTerms,
          )}
        </div>
      </ShowcaseBlock>
    </div>
  );
}
