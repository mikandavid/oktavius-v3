import { describe, expect, it, vi } from 'vitest';

import { runDetailDeleteAction } from './detailDeleteAction';

describe('runDetailDeleteAction', () => {
  it('waits for the delete request before showing success and navigating away', async () => {
    const calls: string[] = [];

    await runDetailDeleteAction({
      deleteRecord: async () => {
        calls.push('delete:start');
        await Promise.resolve();
        calls.push('delete:end');
      },
      navigate: (to) => calls.push(`navigate:${to}`),
      redirectTo: '/records',
      successMessage: 'Record deleted.',
      errorMessage: 'Record could not be deleted.',
      toast: {
        success: (message) => calls.push(`success:${message}`),
        fromApiError: vi.fn(),
      },
    });

    expect(calls).toEqual([
      'delete:start',
      'delete:end',
      'success:Record deleted.',
      'navigate:/records',
    ]);
  });

  it('reports delete failures without navigating away', async () => {
    const error = new Error('Delete failed.');
    const navigate = vi.fn();
    const fromApiError = vi.fn();

    await runDetailDeleteAction({
      deleteRecord: async () => {
        throw error;
      },
      navigate,
      redirectTo: '/records',
      successMessage: 'Record deleted.',
      errorMessage: 'Record could not be deleted.',
      toast: {
        success: vi.fn(),
        fromApiError,
      },
    });

    expect(fromApiError).toHaveBeenCalledWith(error, 'Record could not be deleted.');
    expect(navigate).not.toHaveBeenCalled();
  });
});
