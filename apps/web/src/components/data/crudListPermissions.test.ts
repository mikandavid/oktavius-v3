import { describe, expect, it, vi } from 'vitest';

import { filterCrudListPermissions } from './crudListPermissions';
import type { BulkAction, CrudColumn, CrudRowAction } from './crudTableTypes';

type Row = { id: string; name: string; margin: string };

describe('filterCrudListPermissions', () => {
  const columns: CrudColumn<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'margin', header: 'Margin', permission: 'manageOrganization' },
  ];

  const rowActions: CrudRowAction<Row>[] = [
    { key: 'open', label: 'Open', onClick: vi.fn() },
    { key: 'approve', label: 'Approve', permission: 'manageOrganization', onClick: vi.fn() },
  ];

  const bulkActions: BulkAction[] = [
    { key: 'export', label: 'Export', onClick: vi.fn() },
    { key: 'reassign', label: 'Reassign', permission: 'manageOrganization', onClick: vi.fn() },
  ];

  it('hides permissioned list columns and custom actions from non-manager memberships', () => {
    const filtered = filterCrudListPermissions({
      columns,
      rowActions,
      bulkActions,
      subject: { isSuperadmin: false, orgRole: 'Member' },
    });

    expect(filtered.columns.map((column) => column.key)).toEqual(['name']);
    expect(filtered.rowActions.map((action) => action.key)).toEqual(['open']);
    expect(filtered.bulkActions.map((action) => action.key)).toEqual(['export']);
  });

  it('keeps permissioned list columns and custom actions for organization managers', () => {
    const filtered = filterCrudListPermissions({
      columns,
      rowActions,
      bulkActions,
      subject: { isSuperadmin: false, orgRole: 'Admin' },
    });

    expect(filtered.columns.map((column) => column.key)).toEqual(['name', 'margin']);
    expect(filtered.rowActions.map((action) => action.key)).toEqual(['open', 'approve']);
    expect(filtered.bulkActions.map((action) => action.key)).toEqual(['export', 'reassign']);
  });
});
