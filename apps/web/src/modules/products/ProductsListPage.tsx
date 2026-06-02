import { useCallback } from 'react';

import { useApiRegistry } from '@/api/ApiProvider';
import { useDemoData } from '@/app/demo-data';
import {
  StandardCrudListPage,
  type StandardCrudListRequestParams,
} from '@/components/data/StandardCrudListPage';
import { useOrgNavPaths, useOrgProfile } from '@/lib/org-profiles/useOrgProfile';

import {
  PRODUCT_SAVED_VIEWS,
  ProductsListHeaderActions,
  productColumns,
  productFilters,
  productsPageIcon,
} from './shared';
import { importProductsFromFile } from './productImport';

export function ProductsListPage() {
  const api = useApiRegistry();
  const { products } = useDemoData();
  const profile = useOrgProfile();
  const nav = useOrgNavPaths();
  const loadProducts = useCallback(
    (params: StandardCrudListRequestParams) => api.products.list(params),
    [api.products],
  );

  return (
    <StandardCrudListPage
      title={profile.terminology.products}
      subtitle={
        profile.industryKey === 'funeral'
          ? 'Leistungen, Särge, Urnen und Druck — aus Osiris-Seed'
          : 'Catalog items and pricing'
      }
      icon={productsPageIcon()}
      headerActions={
        <ProductsListHeaderActions
          onImport={(file) => importProductsFromFile(file, api.products)}
        />
      }
      rows={products}
      loadRows={loadProducts}
      columns={productColumns}
      filters={productFilters}
      savedViews={PRODUCT_SAVED_VIEWS}
      defaultSort="name"
      filterKeys={['status', 'category']}
      searchKeys={['name', 'sku', 'category']}
      searchPlaceholder="Search products"
      entityLabel="product"
      getRowHref={(row) => `${nav.products}/${row.id}`}
      onDeleteRows={(ids) =>
        Promise.all(ids.map((id) => api.products.delete(id))).then(() => undefined)
      }
      exportFileName="products"
      emptyTitle="No products found"
      emptyDescription="Create a product or adjust your filters."
    />
  );
}
