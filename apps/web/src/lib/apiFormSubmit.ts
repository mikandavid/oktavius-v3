import { ApiValidationError } from '@/api/demo-client';
import type { FormSubmissionFailure, FormSubmissionResult } from '@/lib/formValidation';

export function apiValidationErrorToFormFailure(error: unknown): FormSubmissionFailure | null {
  if (!(error instanceof ApiValidationError)) return null;

  return {
    ok: false,
    message: error.message,
    errors: error.fieldErrors,
  };
}

export async function submitApiForm<T>({
  action,
  onSuccess,
  onError,
}: {
  action: () => Promise<T>;
  onSuccess?: (result: T) => void | Promise<void>;
  onError?: (error: unknown) => void;
}): Promise<FormSubmissionResult> {
  try {
    const result = await action();
    await onSuccess?.(result);
    return { ok: true };
  } catch (error) {
    const validationFailure = apiValidationErrorToFormFailure(error);
    if (validationFailure) return validationFailure;

    onError?.(error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Form could not be saved.',
      errors: {},
    };
  }
}
