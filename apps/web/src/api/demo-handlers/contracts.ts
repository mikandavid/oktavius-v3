import type { Dispatch, SetStateAction } from 'react';

import type { ContractRecord } from '@/app/demo-data';
import {
  ApiValidationError,
  type ContractsHandlers,
  type ContractsListParams,
  type ListResponse,
} from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildContractsDemoHandlersOptions = {
  activeOrgId: string;
  getContracts: () => ContractRecord[];
  setContracts: Dispatch<SetStateAction<ContractRecord[]>>;
};

const CONTRACT_SEARCH_KEYS: Array<keyof ContractRecord> = [
  'contractNumber',
  'title',
  'clientName',
  'owner',
];

function matchesContract(row: ContractRecord, params: ContractsListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const matchesSearch =
    search.length === 0 ||
    CONTRACT_SEARCH_KEYS.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(search),
    );

  const matchesStatus = !params.status || row.status === params.status;
  const matchesClient = !params.clientName || row.clientName === params.clientName;
  const matchesOwner = !params.owner || row.owner === params.owner;

  return matchesSearch && matchesStatus && matchesClient && matchesOwner;
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function validateContractInput(
  contracts: ContractRecord[],
  input: Partial<Pick<ContractRecord, 'clientName' | 'contractNumber' | 'title' | 'value'>>,
  currentId?: string,
) {
  const fieldErrors: Record<string, string> = {};

  if (!input.contractNumber?.trim()) {
    fieldErrors.contractNumber = 'Contract number is required.';
  }
  if (!input.title?.trim()) {
    fieldErrors.title = 'Title is required.';
  }
  if (!input.clientName?.trim()) {
    fieldErrors.clientName = 'Client is required.';
  }

  const value = Number(input.value);
  if (input.value != null && (!Number.isFinite(value) || value < 0)) {
    fieldErrors.value = 'Value must be a positive number.';
  }

  const contractNumber = normalizeText(input.contractNumber);
  if (
    contractNumber &&
    contracts.some(
      (contract) =>
        contract.id !== currentId && normalizeText(contract.contractNumber) === contractNumber,
    )
  ) {
    fieldErrors.contractNumber = 'A contract with this number already exists.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiValidationError('Contract could not be saved.', fieldErrors);
  }
}

function trimContract(input: ContractRecord): ContractRecord {
  return {
    ...input,
    contractNumber: input.contractNumber.trim(),
    title: input.title.trim(),
    clientName: input.clientName.trim(),
    value: input.value.trim(),
    startDate: input.startDate.trim(),
    endDate: input.endDate.trim(),
    owner: input.owner.trim(),
  };
}

export function buildContractsDemoHandlers({
  activeOrgId,
  getContracts,
  setContracts,
}: BuildContractsDemoHandlersOptions): ContractsHandlers {
  return {
    async list(params): Promise<ListResponse<ContractRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const sort = params.sort ?? 'contractNumber';

      const filtered = sortRows(
        getContracts().filter((row) => matchesContract(row, params)),
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
      return getContracts().find((contract) => contract.id === id) ?? null;
    },

    async create(input) {
      validateContractInput(getContracts(), input);
      const next = trimContract({
        orgId: activeOrgId,
        renewalNoticeDays: 30,
        ...input,
        id: `ctr_${Date.now()}`,
      });
      setContracts((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getContracts().find((contract) => contract.id === id);
      if (!existing) {
        throw new Error('Contract not found.');
      }
      validateContractInput(getContracts(), { ...existing, ...input }, id);

      const updated = trimContract({ ...existing, ...input });
      setContracts((current) =>
        current.map((contract) => (contract.id === id ? updated : contract)),
      );
      return updated;
    },

    async delete(id) {
      setContracts((current) => current.filter((contract) => contract.id !== id));
    },
  };
}
