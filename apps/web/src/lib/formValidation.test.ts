import { describe, expect, it } from 'vitest';

import type { FormField } from '@/components/forms/EntityForm';

import {
  filterPermittedFormFields,
  FormSubmissionValidationError,
  normalizeFormSubmissionFailure,
  validateFormFields,
  withFieldErrors,
} from './formValidation';

const fields: FormField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
  },
  {
    name: 'margin',
    label: 'Margin',
    type: 'text',
    required: true,
    permission: 'manageOrganization',
  },
];

describe('permissioned form fields', () => {
  it('hides manager-only fields from member memberships', () => {
    const permitted = filterPermittedFormFields(fields, {
      isSuperadmin: false,
      role: 'member',
      permissions: [],
    });

    expect(permitted.map((field) => field.name)).toEqual(['name']);
  });

  it('keeps manager-only fields for organization managers', () => {
    const permitted = filterPermittedFormFields(fields, {
      isSuperadmin: false,
      role: 'admin',
      permissions: ['org.manage'],
    });

    expect(permitted.map((field) => field.name)).toEqual(['name', 'margin']);
  });

  it('does not validate hidden permissioned fields', () => {
    const errors = validateFormFields(
      fields,
      { name: 'Apex', margin: '' },
      { isSuperadmin: false, role: 'member', permissions: [] },
    );

    expect(errors).toEqual({});
  });
});

describe('form submission validation failures', () => {
  it('normalizes returned backend validation failures', () => {
    const failure = normalizeFormSubmissionFailure({
      ok: false,
      errors: {
        email: 'Email is already in use.',
        name: 'Name is required.',
      },
    });

    expect(failure).toEqual({
      errors: {
        email: 'Email is already in use.',
        name: 'Name is required.',
      },
    });
  });

  it('normalizes thrown form submission validation errors', () => {
    const thrown = new FormSubmissionValidationError({
      errors: {
        email: 'Email is already in use.',
      },
      message: 'Could not save client.',
    });

    expect(normalizeFormSubmissionFailure(thrown)).toEqual({
      errors: {
        email: 'Email is already in use.',
      },
      message: 'Could not save client.',
    });
  });

  it('normalizes server field error contracts', () => {
    const failure = normalizeFormSubmissionFailure({
      fieldErrors: {
        'lines.0.description': 'Description is required.',
        invoiceNumber: 'Invoice number is already used.',
      },
      formError: 'Invoice could not be saved.',
    });

    expect(failure).toEqual({
      errors: {
        'lines.0.description': 'Description is required.',
        invoiceNumber: 'Invoice number is already used.',
      },
      message: 'Invoice could not be saved.',
    });
  });

  it('wraps submit handlers and rethrows server field errors as form validation errors', async () => {
    const submit = withFieldErrors(async () => {
      throw {
        fieldErrors: { email: 'Email is already in use.' },
        formError: 'Client could not be saved.',
      };
    });

    await expect(submit({ email: 'demo@oktavius.test' })).rejects.toMatchObject({
      name: 'FormSubmissionValidationError',
      errors: { email: 'Email is already in use.' },
      message: 'Client could not be saved.',
    });
  });

  it('ignores successful or unrelated submission results', () => {
    expect(normalizeFormSubmissionFailure(undefined)).toBeNull();
    expect(normalizeFormSubmissionFailure({ ok: true })).toBeNull();
    expect(normalizeFormSubmissionFailure(new Error('Network failed'))).toBeNull();
  });
});
