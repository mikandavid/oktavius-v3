import { PageHeaderCtaLink } from '@/components/common/PageHeaderButtons';

import type { ProductRecord } from '@/app/demo-data';
import type { CrudColumn } from '@/components/data/CrudTable';
import type { FormField } from '@/components/forms/EntityForm';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { PlusIcon } from '@/lib/icons';

const PRODUCT_STATUS_MAP = {
  Active: 'success',
  Draft: 'warning',
  Discontinued: 'destructive',
} as const;

export const productColumns: CrudColumn<ProductRecord>[] = [
  { key: 'sku', header: 'SKU', sortable: true, render: (row) => <span className="font-mono text-xs">{row.sku}</span> },
  {
    key: 'name',
    header: 'Product',
    sortable: true,
    render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
  },
  { key: 'category', header: 'Category', sortable: true, hideBelow: 'md' },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => <StatusBadge status={row.status} variantMap={PRODUCT_STATUS_MAP} />,
  },
  {
    key: 'price',
    header: 'Price',
    sortable: true,
    type: 'currency',
    align: 'right',
    meta: { currencySymbol: '€' },
    render: (row) => row.price,
  },
  { key: 'stock', header: 'Stock', sortable: true, align: 'right', hideBelow: 'lg' },
];

export const productFormFields: FormField[] = [
  { name: 'sku', label: 'SKU', type: 'text', required: true, section: 'Product' },
  { name: 'name', label: 'Name', type: 'text', required: true, section: 'Product' },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    options: ['Licenses', 'Services', 'Hardware', 'Subscriptions'],
    required: true,
    section: 'Product',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['Active', 'Draft', 'Discontinued'],
    required: true,
    section: 'Product',
  },
  { name: 'price', label: 'Price', type: 'currency', currencySymbol: '€', required: true, section: 'Pricing' },
  { name: 'stock', label: 'Stock on hand', type: 'number', section: 'Pricing' },
  { name: 'unit', label: 'Unit', type: 'text', section: 'Pricing', placeholder: 'seat, day, unit…' },
];

export type ProductFormValues = {
  sku: string;
  name: string;
  category: string;
  status: string;
  price: string;
  stock: string;
  unit: string;
};

export const productFormDefaults: ProductFormValues = {
  sku: '',
  name: '',
  category: 'Licenses',
  status: 'Draft',
  price: '',
  stock: '0',
  unit: 'unit',
};

export function ProductsHeaderAction() {
  return (
    <PageHeaderCtaLink to="/products/new">
      <PlusIcon size={14} />
      New product
    </PageHeaderCtaLink>
  );
}

export { PRODUCT_STATUS_MAP };

export { productsPageIcon } from '@/lib/modulePageIcons';
