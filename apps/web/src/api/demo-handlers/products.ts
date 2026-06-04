import type { Dispatch, SetStateAction } from 'react';

import type { ProductRecord } from '@/app/demo-data';
import {
  ApiValidationError,
  type ListResponse,
  type ProductsHandlers,
  type ProductsListParams,
} from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildProductsDemoHandlersOptions = {
  activeOrgId: string;
  getProducts: () => ProductRecord[];
  setProducts: Dispatch<SetStateAction<ProductRecord[]>>;
};

const PRODUCT_SEARCH_KEYS: Array<keyof ProductRecord> = ['sku', 'name', 'category', 'unit'];

function matchesProduct(row: ProductRecord, params: ProductsListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const matchesSearch =
    search.length === 0 ||
    PRODUCT_SEARCH_KEYS.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(search),
    );

  const matchesStatus = !params.status || row.status === params.status;
  const matchesCategory = !params.category || row.category === params.category;

  return matchesSearch && matchesStatus && matchesCategory;
}

function normalizeSku(sku: string | null | undefined) {
  return sku?.trim().toLowerCase() ?? '';
}

function validateProductInput(
  products: ProductRecord[],
  input: Partial<Pick<ProductRecord, 'name' | 'sku'>>,
  currentId?: string,
) {
  const fieldErrors: Record<string, string> = {};

  if (!input.sku?.trim()) {
    fieldErrors.sku = 'SKU is required.';
  }
  if (!input.name?.trim()) {
    fieldErrors.name = 'Product name is required.';
  }

  const sku = normalizeSku(input.sku);
  if (
    sku &&
    products.some((product) => product.id !== currentId && normalizeSku(product.sku) === sku)
  ) {
    fieldErrors.sku = 'A product with this SKU already exists.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiValidationError('Product could not be saved.', fieldErrors);
  }
}

export function buildProductsDemoHandlers({
  activeOrgId,
  getProducts,
  setProducts,
}: BuildProductsDemoHandlersOptions): ProductsHandlers {
  return {
    async list(params): Promise<ListResponse<ProductRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const sort = params.sort ?? 'name';

      const filtered = sortRows(
        getProducts().filter((row) => matchesProduct(row, params)),
        sort,
      );
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * pageSize;

      return {
        data: filtered.slice(start, start + pageSize),
        total,
        totalPages,
        page: safePage,
        pageSize,
      };
    },

    async get(id) {
      return getProducts().find((product) => product.id === id) ?? null;
    },

    async create(input) {
      validateProductInput(getProducts(), input);
      const next: ProductRecord = {
        orgId: activeOrgId,
        ...input,
        id: `prd_${Date.now()}`,
        sku: input.sku.trim(),
        name: input.name.trim(),
      };
      setProducts((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getProducts().find((product) => product.id === id);
      if (!existing) {
        throw new Error('Product not found.');
      }
      validateProductInput(getProducts(), { ...existing, ...input }, id);

      const updated: ProductRecord = {
        ...existing,
        ...input,
        sku: input.sku == null ? existing.sku : input.sku.trim(),
        name: input.name == null ? existing.name : input.name.trim(),
      };
      setProducts((current) => current.map((product) => (product.id === id ? updated : product)));
      return updated;
    },

    async delete(id) {
      setProducts((current) => current.filter((product) => product.id !== id));
    },
  };
}
