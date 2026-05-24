import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { useListPageState } from '@/lib/useListPageState';

import { productColumns, productsPageIcon, ProductsHeaderAction } from './shared';

export function ProductsListPage() {
  const { products } = useDemoData();

  const list = useListPageState({
    rows: products,
    defaultSort: 'name',
    pageSize: 10,
    filterKeys: ['status', 'category'],
    filterFn: (product, { search, filters }) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q);
      const matchesStatus = filters.status.length === 0 || product.status === filters.status;
      const matchesCategory =
        filters.category.length === 0 || product.category === filters.category;
      return matchesSearch && matchesStatus && matchesCategory;
    },
  });

  return (
    <CrudMainView
      title="Products"
      subtitle="Catalog of sellable items, licenses, and services."
      icon={productsPageIcon()}
      headerActions={<ProductsHeaderAction />}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search SKU, name, category…"
      filters={[
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'Active', label: 'Active' },
            { value: 'Draft', label: 'Draft' },
            { value: 'Discontinued', label: 'Discontinued' },
          ],
        },
        {
          key: 'category',
          label: 'Category',
          options: [
            { value: 'Licenses', label: 'Licenses' },
            { value: 'Services', label: 'Services' },
            { value: 'Hardware', label: 'Hardware' },
          ],
        },
      ]}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      rows={list.paged}
      columns={productColumns}
      allRows={list.filtered}
      exportOptions={{ fileName: 'products', label: 'Export' }}
      emptyTitle="No products found"
      entityLabel="product"
      getRowHref={(p) => `/products/${p.id}`}
      sort={list.sort}
      onSortChange={list.onSortChange}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
    />
  );
}
