import { useEffect, useState } from 'react';

import { CrudMainView } from '@/components/data/CrudMainView';
import { useListSavedViews } from '@/components/data/useListSavedViews';
import { useDemoData } from '@/app/demo-data';
import { useListPageState } from '@/lib/useListPageState';

import {
  PRODUCT_SAVED_VIEWS,
  ProductsListHeaderActions,
  productColumns,
  productFilters,
  productsPageIcon,
} from './shared';

export function ProductsListPage() {
  const { products } = useDemoData();
  const [rows, setRows] = useState(products);

  useEffect(() => {
    setRows(products);
  }, [products]);

  const list = useListPageState({
    rows,
    defaultSort: 'name',
    filterKeys: ['status', 'category'],
    searchKeys: ['sku', 'name', 'category', 'unit'],
  });

  const { toolbarTrailing } = useListSavedViews({
    views: PRODUCT_SAVED_VIEWS,
    filterKeys: ['status', 'category'],
    onFilterChange: list.onFilterChange,
    onReset: list.onReset,
  });

  return (
    <CrudMainView
      title="Products"
      subtitle="Catalog items, pricing, and stock levels"
      icon={productsPageIcon()}
      headerActions={<ProductsListHeaderActions />}
      toolbarTrailing={toolbarTrailing}
      columns={productColumns}
      rows={list.paged}
      sort={list.sort}
      onSortChange={list.onSortChange}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search products"
      filters={productFilters}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
      entityLabel="product"
      getRowHref={(row) => `/products/${row.id}`}
      onDeleteRows={(ids) => setRows((current) => current.filter((row) => !ids.includes(row.id)))}
      exportOptions={{ fileName: 'products', label: 'Export' }}
      allRows={list.filtered}
      emptyTitle="No products found"
      emptyDescription="Add a product or adjust your filters."
    />
  );
}
