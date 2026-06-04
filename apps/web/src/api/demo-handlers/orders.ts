import type { Dispatch, SetStateAction } from 'react';

import type { OrderRecord } from '@/app/demo-data';
import {
  ApiValidationError,
  type ListResponse,
  type OrdersHandlers,
  type OrdersListParams,
} from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildOrdersDemoHandlersOptions = {
  activeOrgId: string;
  getOrders: () => OrderRecord[];
  setOrders: Dispatch<SetStateAction<OrderRecord[]>>;
};

const ORDER_SEARCH_KEYS: Array<keyof OrderRecord> = ['orderNumber', 'clientName', 'owner'];

function matchesOrder(row: OrderRecord, params: OrdersListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const matchesSearch =
    search.length === 0 ||
    ORDER_SEARCH_KEYS.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(search),
    );

  const matchesStatus = !params.status || row.status === params.status;
  const matchesOwner = !params.owner || row.owner === params.owner;
  const matchesClient = !params.clientName || row.clientName === params.clientName;

  return matchesSearch && matchesStatus && matchesOwner && matchesClient;
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function validateOrderInput(
  orders: OrderRecord[],
  input: Partial<Pick<OrderRecord, 'clientName' | 'orderNumber' | 'owner' | 'total'>>,
  currentId?: string,
) {
  const fieldErrors: Record<string, string> = {};

  if (!input.orderNumber?.trim()) {
    fieldErrors.orderNumber = 'Order number is required.';
  }
  if (!input.clientName?.trim()) {
    fieldErrors.clientName = 'Client is required.';
  }
  if (!input.owner?.trim()) {
    fieldErrors.owner = 'Owner is required.';
  }

  const total = Number(input.total);
  if (input.total != null && (!Number.isFinite(total) || total < 0)) {
    fieldErrors.total = 'Total must be a positive number.';
  }

  const orderNumber = normalizeText(input.orderNumber);
  if (
    orderNumber &&
    orders.some(
      (order) => order.id !== currentId && normalizeText(order.orderNumber) === orderNumber,
    )
  ) {
    fieldErrors.orderNumber = 'An order with this number already exists.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiValidationError('Order could not be saved.', fieldErrors);
  }
}

function trimOrder(input: OrderRecord): OrderRecord {
  return {
    ...input,
    orderNumber: input.orderNumber.trim(),
    clientId: input.clientId.trim(),
    clientName: input.clientName.trim(),
    total: input.total.trim(),
    orderDate: input.orderDate.trim(),
    dueDate: input.dueDate.trim(),
    owner: input.owner.trim(),
  };
}

export function buildOrdersDemoHandlers({
  activeOrgId,
  getOrders,
  setOrders,
}: BuildOrdersDemoHandlersOptions): OrdersHandlers {
  return {
    async list(params): Promise<ListResponse<OrderRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const sort = params.sort ?? 'orderDate';

      const filtered = sortRows(
        getOrders().filter((row) => matchesOrder(row, params)),
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
      return getOrders().find((order) => order.id === id) ?? null;
    },

    async create(input) {
      validateOrderInput(getOrders(), input);
      const next = trimOrder({
        orgId: activeOrgId,
        ...input,
        id: `ord_${Date.now()}`,
      });
      setOrders((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getOrders().find((order) => order.id === id);
      if (!existing) {
        throw new Error('Order not found.');
      }
      validateOrderInput(getOrders(), { ...existing, ...input }, id);

      const updated = trimOrder({ ...existing, ...input });
      setOrders((current) => current.map((order) => (order.id === id ? updated : order)));
      return updated;
    },

    async delete(id) {
      setOrders((current) => current.filter((order) => order.id !== id));
    },
  };
}
