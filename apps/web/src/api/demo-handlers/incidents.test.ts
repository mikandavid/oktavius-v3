import { describe, expect, it } from 'vitest';

import type { IncidentRecord } from '@/app/demo-data';
import { ApiValidationError } from '@/api/demo-client';

import { buildIncidentsDemoHandlers } from './incidents';

const baseIncident: IncidentRecord = {
  id: 'inc_1',
  orgId: 'org_1',
  incidentNumber: 'INC-001',
  title: 'Existing incident',
  severity: 'High',
  status: 'Open',
  service: 'Public API',
  assignee: 'Existing Owner',
  reportedAt: '2024-01-01T10:00',
  impact: 'Existing impact',
};

function createHandlers(seed: IncidentRecord[] = [baseIncident]) {
  let incidents = seed;
  return {
    handlers: buildIncidentsDemoHandlers({
      activeOrgId: 'org_1',
      getIncidents: () => incidents,
      setIncidents: (next) => {
        incidents = typeof next === 'function' ? next(incidents) : next;
      },
    }),
    getIncidents: () => incidents,
  };
}

describe('buildIncidentsDemoHandlers', () => {
  it('returns paged, sorted list responses with server totals', async () => {
    const { handlers } = createHandlers([
      { ...baseIncident, id: 'inc_1', incidentNumber: 'INC-002', title: 'Bravo incident' },
      { ...baseIncident, id: 'inc_2', incidentNumber: 'INC-001', title: 'Alpha incident' },
      { ...baseIncident, id: 'inc_3', incidentNumber: 'INC-003', title: 'Charlie incident' },
    ]);

    await expect(
      handlers.list({ page: '1', pageSize: '2', sort: 'incidentNumber' }),
    ).resolves.toMatchObject({
      data: [
        expect.objectContaining({ id: 'inc_2', incidentNumber: 'INC-001' }),
        expect.objectContaining({ id: 'inc_1', incidentNumber: 'INC-002' }),
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
        ...baseIncident,
        id: 'inc_1',
        incidentNumber: 'INC-101',
        title: 'Apex API outage',
        severity: 'Critical',
        status: 'Open',
        service: 'Public API',
      },
      {
        ...baseIncident,
        id: 'inc_2',
        incidentNumber: 'INC-102',
        title: 'Apex notification delay',
        severity: 'High',
        status: 'Open',
        service: 'Notifications',
      },
      {
        ...baseIncident,
        id: 'inc_3',
        incidentNumber: 'INC-103',
        title: 'Kunz API outage',
        severity: 'Critical',
        status: 'Resolved',
        service: 'Public API',
      },
    ]);

    const result = await handlers.list({
      page: '1',
      pageSize: '10',
      sort: '-incidentNumber',
      search: 'apex',
      severity: 'Critical',
      status: 'Open',
      service: 'Public API',
    });

    expect(result).toMatchObject({
      data: [expect.objectContaining({ id: 'inc_1', incidentNumber: 'INC-101' })],
      total: 1,
      totalPages: 1,
      page: 1,
    });
  });

  it('rejects duplicate incident numbers with field-level validation errors', async () => {
    const { handlers } = createHandlers();

    await expect(
      handlers.create({
        ...baseIncident,
        incidentNumber: ' inc-001 ',
        title: 'Duplicate incident',
      } as unknown as Parameters<typeof handlers.create>[0]),
    ).rejects.toMatchObject({
      name: 'ApiValidationError',
      fieldErrors: { incidentNumber: 'An incident with this number already exists.' },
    } satisfies Partial<ApiValidationError>);
  });

  it('updates incidents through the API registry contract', async () => {
    const { getIncidents, handlers } = createHandlers();

    const updated = await handlers.update(baseIncident.id, {
      incidentNumber: ' INC-002 ',
      title: ' Updated incident ',
      service: ' Reporting ',
      impact: ' Updated impact ',
    });

    expect(updated.incidentNumber).toBe('INC-002');
    expect(updated.title).toBe('Updated incident');
    expect(updated.service).toBe('Reporting');
    expect(updated.impact).toBe('Updated impact');
    expect(getIncidents()).toEqual([updated]);
  });
});
