import { describe, expect, it } from 'vitest';

import { validateGeneratedModuleContract } from './generatedModuleContract';
import {
  emitGeneratedModuleContract,
  emitGeneratedModuleContracts,
  GENERATED_CRUD_MODULE_IDS,
  GENERATED_MODULE_CONTRACTS,
  GENERATED_MODULE_TEMPLATE_DESCRIPTORS,
} from './generatedModuleContracts';

describe('current generated module contracts', () => {
  it('covers every current standard generated CRUD module', () => {
    expect(GENERATED_MODULE_CONTRACTS.map((contract) => contract.moduleId)).toEqual([
      ...GENERATED_CRUD_MODULE_IDS,
    ]);
  });

  it('keeps current generated modules within the frontend generation contract', () => {
    const violations = GENERATED_MODULE_CONTRACTS.flatMap((contract) =>
      validateGeneratedModuleContract(contract).map((violation) => ({
        moduleId: contract.moduleId,
        ...violation,
      })),
    );

    expect(violations).toEqual([]);
  });

  it('emits generated contracts from module template descriptors', () => {
    expect(emitGeneratedModuleContracts(GENERATED_MODULE_TEMPLATE_DESCRIPTORS)).toEqual(
      GENERATED_MODULE_CONTRACTS,
    );
  });

  it('fills shared generated-module invariants during template emission', () => {
    expect(
      emitGeneratedModuleContract({
        moduleId: 'clients',
        basePath: '/clients',
        apiResource: 'clients',
        list: {
          defaultSort: 'name',
          searchKeys: ['name'],
          filterKeys: ['status'],
        },
        forms: ['create'],
        detail: {
          tabKeys: ['overview'],
          relatedRecordKeys: ['orders'],
        },
      }),
    ).toEqual({
      moduleId: 'clients',
      basePath: '/clients',
      list: {
        usesStandardCrudListPage: true,
        loadRows: true,
        defaultSort: 'name',
        searchKeys: ['name'],
        filters: [{ key: 'status' }],
        filterKeys: ['status'],
      },
      forms: {
        create: { usesEntityForm: true, usesSubmitApiForm: true },
      },
      detail: {
        usesPermissionedHeaderActions: true,
        tabKeys: ['overview'],
        relatedRecords: [{ key: 'orders', usesGeneratedConfig: true }],
      },
    });
  });
});
