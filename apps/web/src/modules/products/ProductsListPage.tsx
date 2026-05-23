import { useMemo, useState } from 'react';

import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { sortRows } from '@/lib/sortRows';

import { productColumns, productsPageIcon, ProductsHeaderAction } from './shared';

export function ProductsListPage() {
  const { products } = useDemoData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({ status: '', category: '' });
  const [sort, setSort] = useState('name');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchesStatus = !filters.status || p.status === filters.status;
      const matchesCategory = !filters.category || p.category === filters.category;
      return matchesSearch && matchesStatus && matchesCategory;
    });
    return sortRows(rows, sort);
  }, [products, search, filters, sort]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <CrudMainView
      title="Products"
      subtitle="Catalog of sellable items, licenses, and services."
      icon={productsPageIcon()}
      headerActions={<ProductsHeaderAction />}
      search={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(1);
      }}
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
      values={filters}
      onFilterChange={(key, value) => {
        setFilters((f) => ({ ...f, [key]: value }));
        setPage(1);
      }}
      onReset={() => {
        setSearch('');
        setFilters({ status: '', category: '' });
        setPage(1);
      }}
      rows={paged}
      columns={productColumns}
      allRows={filtered}
      exportOptions={{ fileName: 'products', label: 'Export' }}
      emptyTitle="No products found"
      entityLabel="product"
      getRowHref={(p) => `/products/${p.id}`}
      sort={sort}
      onSortChange={(s) => {
        setSort(s);
        setPage(1);
      }}
      page={safePage}
      pageSize={pageSize}
      total={filtered.length}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  );
}
