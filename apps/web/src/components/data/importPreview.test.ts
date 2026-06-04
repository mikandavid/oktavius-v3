import { describe, expect, it } from 'vitest';

import { loadImportPreview } from './importPreview';

function createFile(contents: string) {
  return new File([contents], 'records.csv', { type: 'text/csv' });
}

describe('loadImportPreview', () => {
  it('returns normalized columns, sample rows, and total row count', async () => {
    const preview = await loadImportPreview(
      createFile(
        'Client Name,Email,Status\nApex,billing@example.test,active\nWest,ops@example.test,trial',
      ),
      1,
    );

    expect(preview).toEqual({
      columns: ['client_name', 'email', 'status'],
      rows: [{ client_name: 'Apex', email: 'billing@example.test', status: 'active' }],
      totalRows: 2,
    });
  });

  it('returns empty preview data for header-only files', async () => {
    const preview = await loadImportPreview(createFile('Name,Email\n'));

    expect(preview).toEqual({
      columns: [],
      rows: [],
      totalRows: 0,
    });
  });
});
