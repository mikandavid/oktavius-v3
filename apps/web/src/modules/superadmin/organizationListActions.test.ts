import { describe, expect, it, vi } from 'vitest';

import { deleteOrganizationsFromList } from './organizationListActions';

describe('deleteOrganizationsFromList', () => {
  it('deletes every selected organization through the API', async () => {
    const deleted: string[] = [];

    await deleteOrganizationsFromList(['org_1', 'org_2'], {
      deleteOrganization: async (id) => {
        deleted.push(id);
      },
    });

    expect(deleted).toEqual(['org_1', 'org_2']);
  });

  it('waits for asynchronous deletes to finish', async () => {
    const calls: string[] = [];

    await deleteOrganizationsFromList(['org_1'], {
      deleteOrganization: async (id) => {
        calls.push(`start:${id}`);
        await Promise.resolve();
        calls.push(`end:${id}`);
      },
    });

    expect(calls).toEqual(['start:org_1', 'end:org_1']);
  });

  it('does not call the API when nothing is selected', async () => {
    const deleteOrganization = vi.fn();

    await deleteOrganizationsFromList([], { deleteOrganization });

    expect(deleteOrganization).not.toHaveBeenCalled();
  });
});
