import { APP_NAV_MODULES, type AppNavRouteId } from './appNavModules';

export const GENERATED_MODULE_CONTRACT_LIMITS = {
  /** Mirrors FilterToolbar.FILTER_TOOLBAR_SLOT_COUNT and eslint-rules/ux-limits.mjs. */
  maxListFilters: 3,
  /** Mirrors eslint-rules/ux-limits.mjs MAX_DETAIL_TABS. */
  maxDetailTabs: 6,
} as const;

const TASK_RELATION_PARENT_MODULE_IDS = new Set<AppNavRouteId>([
  'cases',
  'clients',
  'orders',
  'projects',
]);

type GeneratedListFilterContract = {
  key: string;
};

type GeneratedListContract = {
  usesStandardCrudListPage: boolean;
  loadRows: boolean;
  defaultSort: string;
  searchKeys: string[];
  filters?: GeneratedListFilterContract[];
  filterKeys?: string[];
};

type GeneratedFormContract = {
  usesEntityForm: boolean;
  usesSubmitApiForm: boolean;
};

type GeneratedRelatedRecordContract = {
  key: string;
  usesGeneratedConfig: boolean;
};

type GeneratedDetailContract = {
  usesPermissionedHeaderActions?: boolean;
  tabKeys?: string[];
  relatedRecords?: GeneratedRelatedRecordContract[];
};

export type GeneratedModuleContract = {
  moduleId: AppNavRouteId;
  basePath: string;
  list?: GeneratedListContract;
  forms?: Partial<Record<'create' | 'edit', GeneratedFormContract>>;
  detail?: GeneratedDetailContract;
};

export type GeneratedModuleContractViolation = {
  code: string;
  message: string;
  path: string;
};

function addViolation(
  violations: GeneratedModuleContractViolation[],
  code: string,
  path: string,
  message: string,
) {
  violations.push({ code, path, message });
}

function validateModuleRegistration(
  contract: GeneratedModuleContract,
  violations: GeneratedModuleContractViolation[],
) {
  const manifestEntry = APP_NAV_MODULES.find((module) => module.id === contract.moduleId);

  if (!manifestEntry) {
    return;
  }

  if (manifestEntry.path !== contract.basePath) {
    addViolation(
      violations,
      'module.path_mismatch',
      'basePath',
      `Generated module "${contract.moduleId}" uses base path "${contract.basePath}", but APP_NAV_MODULES uses "${manifestEntry.path}".`,
    );
  }
}

function validateListContract(
  list: GeneratedListContract | undefined,
  violations: GeneratedModuleContractViolation[],
) {
  if (!list) return;

  if (!list.usesStandardCrudListPage) {
    addViolation(
      violations,
      'list.standard_crud_page_missing',
      'list.usesStandardCrudListPage',
      'Generated CRUD lists must use StandardCrudListPage so list chrome, saved views, export, pagination, and actions stay consistent.',
    );
  }

  if (!list.loadRows) {
    addViolation(
      violations,
      'list.load_rows_missing',
      'list.loadRows',
      'Generated CRUD lists must provide loadRows for server-style paging, sorting, search, filters, and authoritative totals.',
    );
  }

  if (!list.defaultSort.trim()) {
    addViolation(
      violations,
      'list.default_sort_missing',
      'list.defaultSort',
      'Generated CRUD lists must define a stable defaultSort.',
    );
  }

  if (list.searchKeys.length === 0) {
    addViolation(
      violations,
      'list.search_keys_missing',
      'list.searchKeys',
      'Generated CRUD lists must define at least one search key.',
    );
  }

  const filters = list.filters ?? [];
  const filterKeys = list.filterKeys ?? [];

  if (filters.length > GENERATED_MODULE_CONTRACT_LIMITS.maxListFilters) {
    addViolation(
      violations,
      'list.too_many_filters',
      'list.filters',
      `Generated CRUD lists may render at most ${GENERATED_MODULE_CONTRACT_LIMITS.maxListFilters} toolbar filters.`,
    );
  }

  const availableFilterKeys = new Set(filters.map((filter) => filter.key));
  const missingFilterKey = filterKeys.find((key) => !availableFilterKeys.has(key));

  if (missingFilterKey) {
    addViolation(
      violations,
      'list.filter_key_missing',
      'list.filterKeys',
      `Generated CRUD list filterKeys includes "${missingFilterKey}" without a matching filter descriptor.`,
    );
  }
}

function validateFormsContract(
  forms: GeneratedModuleContract['forms'],
  violations: GeneratedModuleContractViolation[],
) {
  if (!forms) return;

  for (const [formName, form] of Object.entries(forms)) {
    if (!form) continue;

    if (!form.usesEntityForm) {
      addViolation(
        violations,
        `forms.${formName}.entity_form_missing`,
        `forms.${formName}.usesEntityForm`,
        `Generated ${formName} forms must use EntityForm so field layout, validation, dirty guards, and permission filtering stay consistent.`,
      );
    }

    if (!form.usesSubmitApiForm) {
      addViolation(
        violations,
        `forms.${formName}.submit_api_form_missing`,
        `forms.${formName}.usesSubmitApiForm`,
        `Generated ${formName} forms must use submitApiForm so backend validation errors map into the shared form error contract.`,
      );
    }
  }
}

function validateDetailContract(
  contract: GeneratedModuleContract,
  detail: GeneratedDetailContract | undefined,
  violations: GeneratedModuleContractViolation[],
) {
  if (!detail) return;

  const tabs = detail.tabKeys ?? [];
  if (tabs.length > GENERATED_MODULE_CONTRACT_LIMITS.maxDetailTabs) {
    addViolation(
      violations,
      'detail.too_many_tabs',
      'detail.tabKeys',
      `Generated detail workspaces may render at most ${GENERATED_MODULE_CONTRACT_LIMITS.maxDetailTabs} tabs.`,
    );
  }

  const inlineRelation = detail.relatedRecords?.find((relation) => !relation.usesGeneratedConfig);
  if (inlineRelation) {
    addViolation(
      violations,
      'detail.related_records_inline',
      'detail.relatedRecords',
      `Related-record panel "${inlineRelation.key}" must use GeneratedRelatedRecordsPanel / RelatedRecordsConfig instead of inline mapping.`,
    );
  }

  const unsupportedTaskRelation = detail.relatedRecords?.find(
    (relation) =>
      relation.key === 'tasks' && !TASK_RELATION_PARENT_MODULE_IDS.has(contract.moduleId),
  );
  if (unsupportedTaskRelation) {
    addViolation(
      violations,
      'detail.related_records_unsupported_task_parent',
      'detail.relatedRecords',
      `Related-record panel "${unsupportedTaskRelation.key}" cannot be declared for "${contract.moduleId}" because TaskRecord parentType does not support that module.`,
    );
  }

  if (detail.usesPermissionedHeaderActions === false) {
    addViolation(
      violations,
      'detail.permissioned_header_actions_missing',
      'detail.usesPermissionedHeaderActions',
      'Generated detail pages with header actions must use DetailPageHeaderActions or DetailActions permission descriptors.',
    );
  }
}

export function validateGeneratedModuleContract(
  contract: GeneratedModuleContract,
): GeneratedModuleContractViolation[] {
  const violations: GeneratedModuleContractViolation[] = [];

  validateModuleRegistration(contract, violations);
  validateListContract(contract.list, violations);
  validateFormsContract(contract.forms, violations);
  validateDetailContract(contract, contract.detail, violations);

  return violations;
}

export function assertGeneratedModuleContract(contract: GeneratedModuleContract) {
  const violations = validateGeneratedModuleContract(contract);
  if (violations.length === 0) return;

  throw new Error(
    [
      `Generated module "${contract.moduleId}" violates the frontend generation contract:`,
      ...violations.map(
        (violation) => `- ${violation.code} (${violation.path}): ${violation.message}`,
      ),
    ].join('\n'),
  );
}
