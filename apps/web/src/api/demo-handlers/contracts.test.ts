import { describe, expect, it } from 'vitest';

import type { ContractRecord } from '@/app/demo-data';
import { ApiValidationError } from '@/api/demo-client';

import { buildContractsDemoHandlers } from './contracts';

const baseContract: ContractRecord = {
  id: 'ctr_1',
  orgId: 'org_1',
  contractNumber: 'CTR-001',
  title: 'Existing Contract',
  clientName: 'Existing Client',
  status: 'Active',
  value: '1000',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  owner: 'Existing Owner',
  renewalNoticeDays: 30,
};

function createHandlers(seed: ContractRecord[] = [baseContract]) {
  let contracts = seed;
  return {
    handlers: buildContractsDemoHandlers({
      activeOrgId: 'org_1',
      getContracts: () => contracts,
      setContracts: (next) => {
        contracts = typeof next === 'function' ? next(contracts) : next;
      },
    }),
    getContracts: () => contracts,
  };
}

describe('buildContractsDemoHandlers', () => {
  it('returns paged, sorted list responses with server totals', async () => {
    const { handlers } = createHandlers([
      { ...baseContract, id: 'ctr_1', contractNumber: 'CTR-002', title: 'Bravo Contract' },
      { ...baseContract, id: 'ctr_2', contractNumber: 'CTR-001', title: 'Alpha Contract' },
      { ...baseContract, id: 'ctr_3', contractNumber: 'CTR-003', title: 'Charlie Contract' },
    ]);

    await expect(
      handlers.list({ page: '1', pageSize: '2', sort: 'contractNumber' }),
    ).resolves.toMatchObject({
      data: [
        expect.objectContaining({ id: 'ctr_2', contractNumber: 'CTR-001' }),
        expect.objectContaining({ id: 'ctr_1', contractNumber: 'CTR-002' }),
      ],
      total: 3,
      totalPages: 2,
      page: 1,
      pageSize: 2,
    });
  });

  it('applies search and filter params before pagination', async () => {
    const { handlers } = createHandlers([
      {
        ...baseContract,
        id: 'ctr_1',
        contractNumber: 'CTR-101',
        title: 'Apex master agreement',
        clientName: 'Apex Client',
        status: 'Active',
        owner: 'Anna Hofer',
      },
      {
        ...baseContract,
        id: 'ctr_2',
        contractNumber: 'CTR-102',
        title: 'Apex draft agreement',
        clientName: 'Apex Client',
        status: 'Draft',
        owner: 'Anna Hofer',
      },
      {
        ...baseContract,
        id: 'ctr_3',
        contractNumber: 'CTR-103',
        title: 'Kunz master agreement',
        clientName: 'Kunz Client',
        status: 'Active',
        owner: 'Markus Leitner',
      },
    ]);

    const result = await handlers.list({
      page: '1',
      pageSize: '10',
      sort: '-contractNumber',
      search: 'apex',
      status: 'Active',
      clientName: 'Apex Client',
      owner: 'Anna Hofer',
    });

    expect(result).toMatchObject({
      data: [expect.objectContaining({ id: 'ctr_1', contractNumber: 'CTR-101' })],
      total: 1,
      totalPages: 1,
      page: 1,
    });
  });

  it('rejects duplicate contract numbers with field-level validation errors', async () => {
    const { handlers } = createHandlers();

    await expect(
      handlers.create({
        ...baseContract,
        contractNumber: ' ctr-001 ',
        title: 'Duplicate Contract',
      } as unknown as Parameters<typeof handlers.create>[0]),
    ).rejects.toMatchObject({
      name: 'ApiValidationError',
      fieldErrors: { contractNumber: 'A contract with this number already exists.' },
    } satisfies Partial<ApiValidationError>);
  });

  it('updates contracts through the API registry contract', async () => {
    const { getContracts, handlers } = createHandlers();

    const updated = await handlers.update(baseContract.id, {
      contractNumber: ' CTR-002 ',
      title: ' Updated Contract ',
      clientName: ' Updated Client ',
      value: ' 1250 ',
    });

    expect(updated.contractNumber).toBe('CTR-002');
    expect(updated.title).toBe('Updated Contract');
    expect(updated.clientName).toBe('Updated Client');
    expect(updated.value).toBe('1250');
    expect(getContracts()).toEqual([updated]);
  });
});
