import type { BadgeProps } from '@oktavius/base-ui';

import { PageHeaderCtaLink } from '@/components/common/PageHeaderButtons';
import { BulkImportTrigger } from '@/components/data/BulkImportWizard';
import type { SavedViewPreset } from '@/components/data/useListSavedViews';
import type { CrudColumn } from '@/components/data/CrudTable';
import { statusColumn } from '@/components/data/columns';
import type { FilterDef } from '@/components/data/FilterToolbar';
import type { FormField } from '@/components/forms/EntityForm';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import type { ProductRecord } from '@/app/demo-data';
import { PlusIcon } from '@/lib/icons';
import { productsPageIcon } from '@/lib/modulePageIcons';

export { productsPageIcon };

export const PRODUCT_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  Active: 'success',
  Discontinued: 'destructive',
  Draft: 'secondary',
};

export const PRODUCT_CATEGORIES = ['Licenses', 'Services', 'Hardware'] as const;

export const productColumns: CrudColumn<ProductRecord>[] = [
  { key: 'sku', header: 'SKU', sortable: true },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'category', header: 'Category', sortable: true, type: 'badge' },
  statusColumn('status', 'Status', PRODUCT_STATUS_VARIANT),
  {
    key: 'price',
    header: 'Price',
    sortable: true,
    type: 'currency',
    meta: { currencySymbol: '€' },
    align: 'right',
  },
  { key: 'stock', header: 'Stock', sortable: true, align: 'right' },
  { key: 'unit', header: 'Unit', sortable: true },
];

export const productFilters: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'Discontinued', label: 'Discontinued' },
      { value: 'Draft', label: 'Draft' },
    ],
  },
  {
    key: 'category',
    label: 'Category',
    options: PRODUCT_CATEGORIES.map((category) => ({
      value: category,
      label: category,
    })),
  },
];

export type ProductFormValues = {
  sku: string;
  name: string;
  category: ProductRecord['category'];
  status: ProductRecord['status'];
  currency: string;
  price: string;
  stock: string;
  unit: string;
};

export const productFormDefaults: ProductFormValues = {
  sku: '',
  name: '',
  category: 'Licenses',
  status: 'Draft',
  currency: 'EUR',
  price: '',
  stock: '0',
  unit: 'unit',
};

export const productFormFields: FormField[] = [
  { name: 'sku', label: 'SKU', type: 'text', required: true, section: 'Product' },
  { name: 'name', label: 'Name', type: 'text', required: true, section: 'Product' },
  {
    name: 'category',
    label: 'Category',
    type: 'combobox',
    options: [...PRODUCT_CATEGORIES],
    section: 'Product',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'combobox',
    options: ['Active', 'Discontinued', 'Draft'],
    section: 'Product',
  },
  { name: 'unit', label: 'Unit', type: 'text', section: 'Inventory' },
  { name: 'stock', label: 'Stock', type: 'number', section: 'Inventory' },
  { name: 'price', label: 'Price', type: 'currency', currencySymbol: '€', section: 'Pricing' },
  { name: 'currency', label: 'Currency', type: 'text', section: 'Pricing' },
];

export const PRODUCT_SAVED_VIEWS: SavedViewPreset[] = [
  { id: 'all', label: 'All products', isDefault: true, filters: { status: '', category: '' } },
  { id: 'active', label: 'Active', filters: { status: 'Active', category: '' } },
  { id: 'licenses', label: 'Licenses', filters: { status: '', category: 'Licenses' } },
  { id: 'services', label: 'Services', filters: { status: '', category: 'Services' } },
];

export function ProductsHeaderAction() {
  return (
    <PageHeaderCtaLink to="/products/new">
      <PlusIcon size={14} />
      New product
    </PageHeaderCtaLink>
  );
}

export function ProductsListHeaderActions() {
  return (
    <>
      <BulkImportTrigger entityLabel="products" />
      <ProductsHeaderAction />
    </>
  );
}

export function productStatusBadge(status: ProductRecord['status']) {
  return <StatusBadge status={status} variantMap={PRODUCT_STATUS_VARIANT} />;
}
