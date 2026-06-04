import { describe, expect, it, vi } from 'vitest';

import { completeBulkImport } from './bulkImportActions';

function createFile(name = 'clients.csv') {
  return new File(['name,email\nApex,billing@example.test'], name, { type: 'text/csv' });
}

describe('completeBulkImport', () => {
  it('requires a selected file before importing', async () => {
    const onImport = vi.fn();
    const toast = { success: vi.fn(), error: vi.fn(), fromApiError: vi.fn() };

    const result = await completeBulkImport({
      file: null,
      entityLabel: 'clients',
      onImport,
      toast,
    });

    expect(result).toBe(false);
    expect(onImport).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Choose a file before importing clients.');
  });

  it('awaits the import callback before reporting success', async () => {
    const calls: string[] = [];
    const file = createFile();

    const result = await completeBulkImport({
      file,
      entityLabel: 'clients',
      onImport: async (selectedFile) => {
        calls.push(`import:start:${selectedFile.name}`);
        await Promise.resolve();
        calls.push('import:end');
      },
      toast: {
        success: (message) => calls.push(`success:${message}`),
        error: vi.fn(),
        fromApiError: vi.fn(),
      },
    });

    expect(result).toBe(true);
    expect(calls).toEqual([
      'import:start:clients.csv',
      'import:end',
      'success:Imported clients from clients.csv.',
    ]);
  });

  it('reports imported row counts when the import callback returns one', async () => {
    const toast = { success: vi.fn(), error: vi.fn(), fromApiError: vi.fn() };

    const result = await completeBulkImport({
      file: createFile(),
      entityLabel: 'clients',
      onImport: async () => 3,
      toast,
    });

    expect(result).toBe(true);
    expect(toast.success).toHaveBeenCalledWith('Imported 3 clients from clients.csv.');
  });

  it('reports import failures without claiming success', async () => {
    const error = new Error('Import failed.');
    const toast = { success: vi.fn(), error: vi.fn(), fromApiError: vi.fn() };

    const result = await completeBulkImport({
      file: createFile(),
      entityLabel: 'clients',
      onImport: async () => {
        throw error;
      },
      toast,
    });

    expect(result).toBe(false);
    expect(toast.fromApiError).toHaveBeenCalledWith(error, 'Clients could not be imported.');
    expect(toast.success).not.toHaveBeenCalled();
  });
});
