import { describe, expect, it } from 'vitest';

import { parseImportFile } from './importFileParser';

function createFile(contents: string, name = 'records.csv', type = 'text/csv') {
  return new File([contents], name, { type });
}

describe('parseImportFile', () => {
  it('parses CSV headers and quoted values into row objects', async () => {
    const rows = await parseImportFile(
      createFile('Name,Email,Notes\n"Apex, GmbH",billing@example.test,"Priority account"'),
    );

    expect(rows).toEqual([
      {
        name: 'Apex, GmbH',
        email: 'billing@example.test',
        notes: 'Priority account',
      },
    ]);
  });

  it('drops empty rows and normalizes header keys', async () => {
    const rows = await parseImportFile(
      createFile('Client Name,Account Manager\nApex,Sam\n,\nWest,Nora'),
    );

    expect(rows).toEqual([
      { client_name: 'Apex', account_manager: 'Sam' },
      { client_name: 'West', account_manager: 'Nora' },
    ]);
  });

  it('rejects files without headers', async () => {
    await expect(parseImportFile(createFile('\n\n'))).rejects.toThrow(
      'Import file has no header row.',
    );
  });
});
