import { describe, expect, it } from 'vitest';

import type { CaseRecord, ClientRecord } from '@/app/demo-data';
import { ApiValidationError } from '@/api/demo-client';

import { buildCasesDemoHandlers } from './cases';

const client: ClientRecord = {
  id: 'cli_1',
  orgId: 'org_1',
  name: 'Apex GmbH',
  type: 'company',
  industry: 'Technology',
  status: 'active',
  email: 'apex@example.com',
  phone: '',
  website: '',
  country: 'AT',
  city: 'Vienna',
  tags: [],
  notes: '',
  annualRevenue: '',
  contractStart: '',
  contractEnd: '',
  accountManager: '',
  createdAt: '2026-01-01',
};

const baseCase: CaseRecord = {
  id: 'case_1',
  orgId: 'org_1',
  caseNumber: 'CASE-2026-0001',
  title: 'Existing case',
  type: 'Support',
  stage: 'Intake',
  priority: 'Normal',
  clientId: client.id,
  clientName: client.name,
  assignee: 'Anna',
  openedAt: '2026-01-01',
  dueAt: '',
  slaStatus: 'ok',
  summary: '',
};

function createHandlers(seed: CaseRecord[] = [baseCase]) {
  let cases = seed;
  return {
    handlers: buildCasesDemoHandlers({
      activeOrgId: 'org_1',
      industryKey: 'generic',
      getCases: () => cases,
      getClients: () => [client],
      setCases: (next) => {
        cases = typeof next === 'function' ? next(cases) : next;
      },
    }),
    getCases: () => cases,
  };
}

describe('buildCasesDemoHandlers', () => {
  it('returns paged, sorted list responses with server totals', async () => {
    const { handlers } = createHandlers([
      { ...baseCase, id: 'case_1', caseNumber: 'CASE-2026-0002', title: 'Bravo case' },
      { ...baseCase, id: 'case_2', caseNumber: 'CASE-2026-0001', title: 'Alpha case' },
      { ...baseCase, id: 'case_3', caseNumber: 'CASE-2026-0003', title: 'Charlie case' },
    ]);

    await expect(
      handlers.list({ page: '1', pageSize: '2', sort: 'caseNumber' }),
    ).resolves.toMatchObject({
      data: [
        expect.objectContaining({ id: 'case_2', caseNumber: 'CASE-2026-0001' }),
        expect.objectContaining({ id: 'case_1', caseNumber: 'CASE-2026-0002' }),
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
        ...baseCase,
        id: 'case_1',
        caseNumber: 'CASE-2026-0101',
        title: 'Apex billing case',
        type: 'Billing',
        stage: 'Investigation',
        priority: 'Critical',
        assignee: 'Anna',
      },
      {
        ...baseCase,
        id: 'case_2',
        caseNumber: 'CASE-2026-0102',
        title: 'Apex support case',
        type: 'Support',
        stage: 'Investigation',
        priority: 'Critical',
        assignee: 'Anna',
      },
      {
        ...baseCase,
        id: 'case_3',
        caseNumber: 'CASE-2026-0103',
        title: 'Kunz billing case',
        type: 'Billing',
        stage: 'Closed',
        priority: 'Normal',
        assignee: 'Markus',
      },
    ]);

    const result = await handlers.list({
      page: '1',
      pageSize: '10',
      sort: '-caseNumber',
      search: 'apex',
      type: 'Billing',
      stage: 'Investigation',
      priority: 'Critical',
    });

    expect(result).toMatchObject({
      data: [expect.objectContaining({ id: 'case_1', caseNumber: 'CASE-2026-0101' })],
      total: 1,
      totalPages: 1,
      page: 1,
    });
  });

  it('rejects unknown client names with field-level validation errors', async () => {
    const { handlers } = createHandlers();

    await expect(
      handlers.create({
        ...baseCase,
        title: 'New case',
        clientName: 'Missing GmbH',
      } as unknown as Parameters<typeof handlers.create>[0]),
    ).rejects.toMatchObject({
      name: 'ApiValidationError',
      fieldErrors: { clientName: 'Select an existing client.' },
    } satisfies Partial<ApiValidationError>);
  });

  it('creates cases through the API registry contract', async () => {
    const { getCases, handlers } = createHandlers([]);
    const unsafeInput = {
      ...baseCase,
      id: 'ignored',
      caseNumber: 'ignored',
      openedAt: 'ignored',
      title: 'New case',
      clientName: client.name,
    } as unknown as Parameters<typeof handlers.create>[0];

    const created = await handlers.create(unsafeInput);

    expect(created.id).toMatch(/^case_/);
    expect(created.caseNumber).toMatch(/^CASE-\d{4}-\d{4}$/);
    expect(created.clientId).toBe(client.id);
    expect(created.slaStatus).toBe('ok');
    expect(getCases()).toEqual([created]);
  });

  it('rejects invalid stage moves before mutating the case', async () => {
    const { getCases, handlers } = createHandlers();

    await expect(
      handlers.updateStage(baseCase.id, 'Not a stage' as CaseRecord['stage']),
    ).rejects.toThrow('Invalid case stage.');

    expect(getCases()).toEqual([baseCase]);
  });
});
