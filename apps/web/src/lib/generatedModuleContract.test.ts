import { describe, expect, it } from 'vitest';

import {
  assertGeneratedModuleContract,
  GENERATED_MODULE_CONTRACT_LIMITS,
  validateGeneratedModuleContract,
  type GeneratedModuleContract,
} from './generatedModuleContract';

const validContract: GeneratedModuleContract = {
  moduleId: 'clients',
  basePath: '/clients',
  list: {
    usesStandardCrudListPage: true,
    loadRows: true,
    defaultSort: 'name',
    searchKeys: ['name', 'email'],
    filters: [{ key: 'status' }, { key: 'city' }],
    filterKeys: ['status', 'city'],
  },
  forms: {
    create: { usesEntityForm: true, usesSubmitApiForm: true },
    edit: { usesEntityForm: true, usesSubmitApiForm: true },
  },
  detail: {
    usesPermissionedHeaderActions: true,
    tabKeys: ['overview', 'orders', 'activity', 'files'],
    relatedRecords: [
      { key: 'orders', usesGeneratedConfig: true },
      { key: 'contracts', usesGeneratedConfig: true },
    ],
  },
};

function validate(overrides: Partial<GeneratedModuleContract>) {
  return validateGeneratedModuleContract({ ...validContract, ...overrides });
}

describe('generated module contract validation', () => {
  it('accepts a generated module using the shared module patterns', () => {
    expect(validateGeneratedModuleContract(validContract)).toEqual([]);
  });

  it('allows generated module templates before they are installed in app navigation', () => {
    expect(validate({ moduleId: 'clients', basePath: '/contacts' })).toEqual([]);
  });

  it('requires installed generated modules to match the app nav manifest base path', () => {
    const violations = validate({
      moduleId: 'documents',
      basePath: '/contacts',
    });

    expect(violations).toContainEqual(
      expect.objectContaining({
        code: 'module.path_mismatch',
        path: 'basePath',
      }),
    );
  });

  it('requires generated lists to use the shared server-style list contract', () => {
    const violations = validate({
      list: {
        ...validContract.list!,
        usesStandardCrudListPage: false,
        loadRows: false,
        defaultSort: '',
        searchKeys: [],
      },
    });

    expect(violations.map((violation) => violation.code)).toEqual(
      expect.arrayContaining([
        'list.standard_crud_page_missing',
        'list.load_rows_missing',
        'list.default_sort_missing',
        'list.search_keys_missing',
      ]),
    );
  });

  it('enforces filter toolbar limits and filter key alignment', () => {
    const violations = validate({
      list: {
        ...validContract.list!,
        filters: [{ key: 'status' }, { key: 'city' }, { key: 'owner' }, { key: 'segment' }],
        filterKeys: ['status', 'city', 'unknown'],
      },
    });

    expect(GENERATED_MODULE_CONTRACT_LIMITS.maxListFilters).toBe(3);
    expect(violations.map((violation) => violation.code)).toEqual(
      expect.arrayContaining(['list.too_many_filters', 'list.filter_key_missing']),
    );
  });

  it('requires generated forms to use EntityForm and submitApiForm', () => {
    const violations = validate({
      forms: {
        create: { usesEntityForm: false, usesSubmitApiForm: false },
        edit: { usesEntityForm: true, usesSubmitApiForm: false },
      },
    });

    expect(violations.map((violation) => violation.code)).toEqual(
      expect.arrayContaining([
        'forms.create.entity_form_missing',
        'forms.create.submit_api_form_missing',
        'forms.edit.submit_api_form_missing',
      ]),
    );
  });

  it('enforces detail tab limits and generated related-record configs', () => {
    const violations = validate({
      detail: {
        ...validContract.detail!,
        tabKeys: ['overview', 'summary', 'orders', 'contracts', 'activity', 'files', 'audit'],
        relatedRecords: [
          { key: 'orders', usesGeneratedConfig: true },
          { key: 'tasks', usesGeneratedConfig: false },
        ],
      },
    });

    expect(GENERATED_MODULE_CONTRACT_LIMITS.maxDetailTabs).toBe(6);
    expect(violations.map((violation) => violation.code)).toEqual(
      expect.arrayContaining(['detail.too_many_tabs', 'detail.related_records_inline']),
    );
  });

  it('rejects task relations for modules that task records cannot target', () => {
    const violations = validate({
      moduleId: 'users',
      basePath: '/users',
      detail: {
        ...validContract.detail!,
        relatedRecords: [{ key: 'tasks', usesGeneratedConfig: true }],
      },
    });

    expect(violations).toContainEqual(
      expect.objectContaining({
        code: 'detail.related_records_unsupported_task_parent',
        path: 'detail.relatedRecords',
      }),
    );
  });

  it('throws a readable assertion error for CI/generator use', () => {
    expect(() =>
      assertGeneratedModuleContract({
        ...validContract,
        list: { ...validContract.list!, loadRows: false },
      }),
    ).toThrowError(/list.load_rows_missing/);
  });
});
