import { describe, expect, it } from 'vitest';

import type { FormField } from '@/components/forms/EntityForm';

import {
  FormSubmissionValidationError,
  filterPermittedFormFields,
  normalizeFormSubmissionFailure,
  validateFormFields,
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
      orgRole: 'Member',
    });

    expect(permitted.map((field) => field.name)).toEqual(['name']);
  });

  it('keeps manager-only fields for organization managers', () => {
    const permitted = filterPermittedFormFields(fields, {
      isSuperadmin: false,
      orgRole: 'Admin',
    });

    expect(permitted.map((field) => field.name)).toEqual(['name', 'margin']);
  });

  it('does not validate hidden permissioned fields', () => {
    const errors = validateFormFields(
      fields,
      { name: 'Apex', margin: '' },
      { isSuperadmin: false, orgRole: 'Member' },
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

  it('ignores successful or unrelated submission results', () => {
    expect(normalizeFormSubmissionFailure(undefined)).toBeNull();
    expect(normalizeFormSubmissionFailure({ ok: true })).toBeNull();
    expect(normalizeFormSubmissionFailure(new Error('Network failed'))).toBeNull();
  });
});
