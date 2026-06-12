import { describe, expect, it, vi } from 'vitest';

import { ApiValidationError } from '@/api/contracts';

import { apiValidationErrorToFormFailure, submitApiForm } from './apiFormSubmit';

describe('api form submit adapter', () => {
  it('converts API validation errors into EntityForm submission failures', () => {
    const failure = apiValidationErrorToFormFailure(
      new ApiValidationError('Client could not be saved.', {
        email: 'A client with this email already exists.',
      }),
    );

    expect(failure).toEqual({
      ok: false,
      message: 'Client could not be saved.',
      errors: {
        email: 'A client with this email already exists.',
      },
    });
  });

  it('runs success handlers and returns a successful form result', async () => {
    const onSuccess = vi.fn();

    const result = await submitApiForm({
      action: async () => ({ id: 'cli_1' }),
      onSuccess,
    });

    expect(result).toEqual({ ok: true });
    expect(onSuccess).toHaveBeenCalledWith({ id: 'cli_1' });
  });

  it('delegates non-validation errors to the caller without resetting the form', async () => {
    const error = new Error('Network failed');
    const onError = vi.fn();

    const result = await submitApiForm({
      action: async () => {
        throw error;
      },
      onError,
    });

    expect(result).toEqual({
      ok: false,
      message: 'Network failed',
      errors: {},
    });
    expect(onError).toHaveBeenCalledWith(error);
  });
});
