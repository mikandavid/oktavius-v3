import type { FormField, FormFieldValue } from '@/lib/forms/types';
import type { PermissionSubject } from '@/lib/permissions';
import { canUsePermissionRequirement } from '@/lib/permissions';

export type { FieldValidationRule } from '@/lib/forms/types';

export type FormValidationErrorMap = Partial<Record<string, string>>;

export type FormSubmissionFailure = {
  ok: false;
  errors?: FormValidationErrorMap;
  message?: string;
};

export type FormSubmissionSuccess = void | {
  ok?: true;
};

export type FormSubmissionResult = FormSubmissionSuccess | FormSubmissionFailure;

export type NormalizedFormSubmissionFailure = {
  errors: FormValidationErrorMap;
  message?: string;
};

export type ServerFieldErrorResponse = {
  fieldErrors?: FormValidationErrorMap;
  formError?: string;
};

export class FormSubmissionValidationError extends Error {
  errors: FormValidationErrorMap;

  constructor({ errors, message }: { errors?: FormValidationErrorMap; message?: string }) {
    super(message ?? 'Form submission failed validation.');
    this.name = 'FormSubmissionValidationError';
    this.errors = errors ?? {};
  }
}

function normalizeErrorMap(errors: unknown): FormValidationErrorMap {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return {};

  const normalized: FormValidationErrorMap = {};
  for (const [key, value] of Object.entries(errors)) {
    if (typeof value === 'string' && value.trim()) {
      normalized[key] = value;
    }
  }
  return normalized;
}

function normalizeServerFieldErrorResponse(value: unknown): NormalizedFormSubmissionFailure | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const candidate = value as Partial<ServerFieldErrorResponse> & { message?: unknown };
  if (!('fieldErrors' in candidate) && !('formError' in candidate)) return null;

  const message =
    typeof candidate.formError === 'string' && candidate.formError.trim()
      ? candidate.formError
      : typeof candidate.message === 'string' && candidate.message.trim()
        ? candidate.message
        : undefined;

  return {
    errors: normalizeErrorMap(candidate.fieldErrors),
    ...(message ? { message } : {}),
  };
}

export function normalizeFormSubmissionFailure(
  value: unknown,
): NormalizedFormSubmissionFailure | null {
  if (value instanceof FormSubmissionValidationError) {
    return {
      errors: value.errors,
      message: value.message,
    };
  }

  const serverFailure = normalizeServerFieldErrorResponse(value);
  if (serverFailure) return serverFailure;

  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const candidate = value as Partial<FormSubmissionFailure> & { ok?: unknown };
  if (candidate.ok !== false) return null;

  return {
    errors: normalizeErrorMap(candidate.errors),
    ...(typeof candidate.message === 'string' && candidate.message.trim()
      ? { message: candidate.message }
      : {}),
  };
}

export function withFieldErrors<TValues, TResult>(
  submitFn: (values: TValues) => TResult | Promise<TResult>,
): (values: TValues) => Promise<TResult> {
  return async (values) => {
    try {
      return await submitFn(values);
    } catch (error) {
      const failure = normalizeFormSubmissionFailure(error);
      if (failure) {
        throw new FormSubmissionValidationError({
          errors: failure.errors,
          message: failure.message,
        });
      }
      throw error;
    }
  };
}

export function isFieldVisible(field: FormField, values: Record<string, FormFieldValue>): boolean {
  if (field.visibleWhen && !field.visibleWhen(values)) return false;
  return field.visibleIf ? field.visibleIf(values) : true;
}

export function filterVisibleFields(
  fields: FormField[],
  values: Record<string, FormFieldValue>,
): FormField[] {
  return fields.filter((field) => isFieldVisible(field, values));
}

export function filterPermittedFormFields(
  fields: FormField[],
  subject?: PermissionSubject,
): FormField[] {
  if (!subject) return fields.filter((field) => !field.permission);
  return fields.filter((field) => canUsePermissionRequirement(subject, field.permission));
}

export function validateFormFields(
  fields: FormField[],
  values: Record<string, FormFieldValue>,
  subject?: PermissionSubject,
): Partial<Record<string, string>> {
  const errors: Partial<Record<string, string>> = {};

  for (const field of filterVisibleFields(filterPermittedFormFields(fields, subject), values)) {
    const value = values[field.name];
    const rule = field.validate;
    const required = rule?.required ?? field.required;

    if (required) {
      const empty =
        value == null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'boolean' && value === false && field.type === 'checkbox');
      if (empty) {
        errors[field.name] = rule?.message ?? `${field.label} is required.`;
        continue;
      }
    }

    if (typeof value === 'string' && rule?.minLength != null && value.length < rule.minLength) {
      errors[field.name] =
        rule.message ?? `${field.label} must be at least ${rule.minLength} characters.`;
      continue;
    }

    if (typeof value === 'string' && rule?.maxLength != null && value.length > rule.maxLength) {
      errors[field.name] =
        rule.message ?? `${field.label} must be at most ${rule.maxLength} characters.`;
      continue;
    }

    if (typeof value === 'string' && rule?.pattern && !rule.pattern.test(value)) {
      errors[field.name] = rule.message ?? `${field.label} is invalid.`;
      continue;
    }

    if (field.type === 'email' && typeof value === 'string' && value.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field.name] = rule?.message ?? `${field.label} must be a valid email.`;
        continue;
      }
    }

    if (field.type === 'url' && typeof value === 'string' && value.trim()) {
      try {
        new URL(value);
      } catch {
        errors[field.name] = rule?.message ?? `${field.label} must be a valid URL.`;
        continue;
      }
    }

    if (field.type === 'json' && typeof value === 'string' && value.trim()) {
      try {
        JSON.parse(value);
      } catch {
        errors[field.name] = rule?.message ?? 'Enter valid JSON.';
      }
      continue;
    }

    if (rule?.custom) {
      const customError = rule.custom(value, values);
      if (customError) {
        errors[field.name] = customError;
      }
    }

    if (!errors[field.name] && field.crossValidate) {
      const crossError = field.crossValidate(values);
      if (crossError) {
        errors[field.name] = crossError;
      }
    }
  }

  return errors;
}

export function valuesAreDirty<T extends Record<string, FormFieldValue>>(
  current: T,
  initial: T,
): boolean {
  return JSON.stringify(current) !== JSON.stringify(initial);
}
