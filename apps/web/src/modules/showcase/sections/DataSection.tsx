import { useEffect, useState } from 'react';

import {
  Avatar,
  Badge,
  CopyButton,
  ListRow,
  MoneyText,
  RelativeTime,
  STAT_CARD_GRID_CLASS,
  SettingsTable,
  StatCard,
} from '@oktavius/base-ui';

import { CrudListShell } from '@/components/data/CrudListShell';
import { SavedViewSelector } from '@/components/data/SavedViewSelector';
import { statusColumn } from '@/components/data/columns';
import type { CrudColumn } from '@/components/data/CrudTable';
import { useDemoData } from '@/app/demo-data';
import type { ProductRecord } from '@/app/demo-data';
import { useListPageState } from '@/lib/useListPageState';
import { toast } from '@/lib/toast';

import { ShowcaseBlock } from '../shared';

const PRODUCT_STATUS_VARIANT = {
  Active: 'success',
  Draft: 'warning',
  Discontinued: 'secondary',
} as const;

const productColumns: CrudColumn<ProductRecord>[] = [
  { key: 'sku', header: 'SKU', sortable: true },
  { key: 'name', header: 'Name', sortable: true },
  statusColumn('status', 'Status', PRODUCT_STATUS_VARIANT),
  {
    key: 'price',
    header: 'Price',
    sortable: true,
    type: 'currency',
    meta: { currencySymbol: '€' },
  },
  { key: 'stock', header: 'Stock', sortable: true },
];

const productFilters = [
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
];

const SETTINGS_ROWS = [
  { id: '1', label: 'Net 30', code: 'NET30', active: true },
  { id: '2', label: 'Net 14', code: 'NET14', active: true },
  { id: '3', label: 'Due on receipt', code: 'DUE', active: false },
];

export function DataSection() {
  const { products } = useDemoData();
  const [rows, setRows] = useState(products);
  const [savedView, setSavedView] = useState('all');

  useEffect(() => {
    setRows(products);
  }, [products]);

  const list = useListPageState({
    rows,
    defaultSort: 'name',
    filterKeys: ['status', 'category'],
    searchKeys: ['name', 'sku', 'category'],
  });

  return (
    <div className="space-y-4">
      <ShowcaseBlock title="StatCard grid" meta="STAT_CARD_GRID_CLASS · max 6 per row">
        <div className={STAT_CARD_GRID_CLASS}>
          <StatCard
            label="Revenue"
            value={<MoneyText value={51340} currency="EUR" compact />}
            delta="+8%"
            trend="up"
          />
          <StatCard label="Open orders" value="3" description="2 confirmed" />
          <StatCard label="Active cases" value="4" delta="1 critical" trend="down" />
          <StatCard label="Overdue invoices" value="1" trend="down" delta="+€15.8K" />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="ListRow variants" meta="default · muted · warning · dashed · queue">
        <ListRow
          title="Apex Technologies GmbH"
          subtitle="Vienna, AT · Enterprise"
          meta="Anna Hofer"
          leading={<Avatar label="Anna Hofer" size="sm" />}
          trailing={<Badge variant="success">Active</Badge>}
        />
        <ListRow variant="muted" title="Muted row" subtitle="De-emphasized context" />
        <ListRow variant="warning" title="Warning row" subtitle="Needs attention" />
        <ListRow variant="dashed" title="Dashed row" subtitle="Placeholder slot" />
        <ListRow
          variant="queue"
          title="Invoice INV-2024-9012"
          subtitle="Donau Logistics AG"
          trailing={<Badge variant="destructive">Overdue</Badge>}
        />
      </ShowcaseBlock>

      <ShowcaseBlock title="Display atoms" meta="MoneyText · RelativeTime · CopyButton">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <MoneyText value={28450} currency="EUR" />
          <RelativeTime date="2024-12-05T10:30:00Z" />
          <CopyButton value="INV-2024-8821" label="Copy invoice number" />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="SettingsTable" meta="Catalog config — lighter than CrudTable">
        <SettingsTable
          columns={[
            { key: 'label', header: 'Label', cell: (row) => row.label },
            { key: 'code', header: 'Code', cell: (row) => row.code },
            {
              key: 'active',
              header: 'Status',
              cell: (row) => (
                <Badge variant={row.active ? 'success' : 'secondary'}>
                  {row.active ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
          ]}
          rows={SETTINGS_ROWS}
          getRowId={(row) => row.id}
          emptyMessage="No rows"
        />
      </ShowcaseBlock>

      <ShowcaseBlock
        title="CrudListShell"
        meta="Live sort · filter · select · bulk delete · pagination"
        actions={
          <SavedViewSelector
            views={[
              { id: 'all', label: 'All products' },
              { id: 'active', label: 'Active only' },
              { id: 'low-stock', label: 'Low stock' },
            ]}
            value={savedView}
            onChange={(id) => {
              setSavedView(id);
              toast.info(`View: ${id}`);
            }}
          />
        }
      >
        <CrudListShell
          search={list.search}
          onSearchChange={list.onSearchChange}
          searchPlaceholder="Search products"
          filters={productFilters}
          values={list.values}
          onFilterChange={list.onFilterChange}
          onReset={list.onReset}
          rows={list.paged}
          columns={productColumns}
          sort={list.sort}
          onSortChange={list.onSortChange}
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          totalPages={list.totalPages}
          onPageChange={list.onPageChange}
          entityLabel="product"
          getRowHref={(row) => `/products/${row.id}`}
          onDeleteRows={(ids) =>
            setRows((current) => current.filter((row) => !ids.includes(row.id)))
          }
          emptyTitle="No products found"
          emptyDescription="Adjust filters or add a product."
        />
      </ShowcaseBlock>
    </div>
  );
}
