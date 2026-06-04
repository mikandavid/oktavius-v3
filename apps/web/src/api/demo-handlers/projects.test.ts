import { describe, expect, it } from 'vitest';

import type { ProjectRecord } from '@/app/demo-data';
import { ApiValidationError } from '@/api/demo-client';

import { buildProjectsDemoHandlers } from './projects';

const baseProject: ProjectRecord = {
  id: 'prj_1',
  orgId: 'org_1',
  name: 'Existing project',
  clientName: 'Existing client',
  status: 'Active',
  manager: 'Existing manager',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  budget: '1000',
  completion: 50,
};

function createHandlers(seed: ProjectRecord[] = [baseProject]) {
  let projects = seed;
  return {
    handlers: buildProjectsDemoHandlers({
      activeOrgId: 'org_1',
      getProjects: () => projects,
      setProjects: (next) => {
        projects = typeof next === 'function' ? next(projects) : next;
      },
    }),
    getProjects: () => projects,
  };
}

describe('buildProjectsDemoHandlers', () => {
  it('returns paged, sorted list responses with server totals', async () => {
    const { handlers } = createHandlers([
      { ...baseProject, id: 'prj_1', name: 'Bravo Project' },
      { ...baseProject, id: 'prj_2', name: 'Alpha Project' },
      { ...baseProject, id: 'prj_3', name: 'Charlie Project' },
    ]);

    await expect(handlers.list({ page: '1', pageSize: '2', sort: 'name' })).resolves.toMatchObject({
      data: [
        expect.objectContaining({ id: 'prj_2', name: 'Alpha Project' }),
        expect.objectContaining({ id: 'prj_1', name: 'Bravo Project' }),
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
        ...baseProject,
        id: 'prj_1',
        name: 'Apex rollout',
        clientName: 'Apex Client',
        status: 'Active',
        manager: 'Anna Hofer',
      },
      {
        ...baseProject,
        id: 'prj_2',
        name: 'Apex planning',
        clientName: 'Apex Client',
        status: 'Planning',
        manager: 'Anna Hofer',
      },
      {
        ...baseProject,
        id: 'prj_3',
        name: 'Kunz rollout',
        clientName: 'Kunz Client',
        status: 'Active',
        manager: 'Markus Leitner',
      },
    ]);

    const result = await handlers.list({
      page: '1',
      pageSize: '10',
      sort: '-name',
      search: 'apex',
      status: 'Active',
      manager: 'Anna Hofer',
      clientName: 'Apex Client',
    });

    expect(result).toMatchObject({
      data: [expect.objectContaining({ id: 'prj_1', name: 'Apex rollout' })],
      total: 1,
      totalPages: 1,
      page: 1,
    });
  });

  it('rejects missing names with field-level validation errors', async () => {
    const { handlers } = createHandlers();

    await expect(
      handlers.update(baseProject.id, {
        name: ' ',
        clientName: ' ',
      }),
    ).rejects.toMatchObject({
      name: 'ApiValidationError',
      fieldErrors: {
        name: 'Project name is required.',
        clientName: 'Client is required.',
      },
    } satisfies Partial<ApiValidationError>);
  });

  it('updates projects through the API registry contract', async () => {
    const { getProjects, handlers } = createHandlers();

    const updated = await handlers.update(baseProject.id, {
      name: ' Updated project ',
      clientName: ' Updated client ',
      manager: ' Updated manager ',
      budget: ' 1250 ',
      completion: 150,
    });

    expect(updated.name).toBe('Updated project');
    expect(updated.clientName).toBe('Updated client');
    expect(updated.manager).toBe('Updated manager');
    expect(updated.budget).toBe('1250');
    expect(updated.completion).toBe(100);
    expect(getProjects()).toEqual([updated]);
  });
});
