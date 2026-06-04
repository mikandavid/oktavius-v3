import type { Dispatch, SetStateAction } from 'react';

import type { InvoiceRecord } from '@/app/demo-data';
import {
  ApiValidationError,
  type InvoicesHandlers,
  type InvoicesListParams,
  type ListResponse,
} from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildInvoicesDemoHandlersOptions = {
  activeOrgId: string;
  getInvoices: () => InvoiceRecord[];
  setInvoices: Dispatch<SetStateAction<InvoiceRecord[]>>;
};

const INVOICE_SEARCH_KEYS: Array<keyof InvoiceRecord> = [
  'invoiceNumber',
  'clientName',
  'orderNumber',
];

function matchesInvoice(row: InvoiceRecord, params: InvoicesListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const matchesSearch =
    search.length === 0 ||
    INVOICE_SEARCH_KEYS.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(search),
    );

  const matchesStatus = !params.status || row.status === params.status;
  const matchesClient = !params.clientName || row.clientName === params.clientName;

  return matchesSearch && matchesStatus && matchesClient;
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function validateInvoiceInput(
  invoices: InvoiceRecord[],
  input: Partial<Pick<InvoiceRecord, 'amount' | 'clientName' | 'invoiceNumber'>>,
  currentId?: string,
) {
  const fieldErrors: Record<string, string> = {};

  if (!input.invoiceNumber?.trim()) {
    fieldErrors.invoiceNumber = 'Invoice number is required.';
  }
  if (!input.clientName?.trim()) {
    fieldErrors.clientName = 'Client is required.';
  }

  const amount = Number(input.amount);
  if (input.amount != null && (!Number.isFinite(amount) || amount < 0)) {
    fieldErrors.amount = 'Amount must be a positive number.';
  }

  const invoiceNumber = normalizeText(input.invoiceNumber);
  if (
    invoiceNumber &&
    invoices.some(
      (invoice) =>
        invoice.id !== currentId && normalizeText(invoice.invoiceNumber) === invoiceNumber,
    )
  ) {
    fieldErrors.invoiceNumber = 'An invoice with this number already exists.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiValidationError('Invoice could not be saved.', fieldErrors);
  }
}

function trimInvoice(input: InvoiceRecord): InvoiceRecord {
  return {
    ...input,
    invoiceNumber: input.invoiceNumber.trim(),
    clientName: input.clientName.trim(),
    orderNumber: input.orderNumber.trim(),
    amount: input.amount.trim(),
    issuedAt: input.issuedAt.trim(),
    dueAt: input.dueAt.trim(),
  };
}

export function buildInvoicesDemoHandlers({
  activeOrgId,
  getInvoices,
  setInvoices,
}: BuildInvoicesDemoHandlersOptions): InvoicesHandlers {
  return {
    async list(params): Promise<ListResponse<InvoiceRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const sort = params.sort ?? 'issuedAt';

      const filtered = sortRows(
        getInvoices().filter((row) => matchesInvoice(row, params)),
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
      return getInvoices().find((invoice) => invoice.id === id) ?? null;
    },

    async create(input) {
      validateInvoiceInput(getInvoices(), input);
      const next = trimInvoice({
        orgId: activeOrgId,
        ...input,
        id: `inv_${Date.now()}`,
      });
      setInvoices((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getInvoices().find((invoice) => invoice.id === id);
      if (!existing) {
        throw new Error('Invoice not found.');
      }
      validateInvoiceInput(getInvoices(), { ...existing, ...input }, id);

      const updated = trimInvoice({ ...existing, ...input });
      setInvoices((current) => current.map((invoice) => (invoice.id === id ? updated : invoice)));
      return updated;
    },

    async delete(id) {
      setInvoices((current) => current.filter((invoice) => invoice.id !== id));
    },
  };
}
