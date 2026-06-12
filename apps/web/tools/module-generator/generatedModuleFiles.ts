import type { GeneratedModuleTemplateDescriptor } from './generatedModuleContracts';

type GeneratedModuleTemplateColumn = NonNullable<
  NonNullable<GeneratedModuleTemplateDescriptor['list']>['columns']
>[number];

type GeneratedModuleTemplateFilter = NonNullable<
  NonNullable<GeneratedModuleTemplateDescriptor['list']>['filters']
>[number];

type GeneratedModuleTemplateSavedView = NonNullable<
  NonNullable<GeneratedModuleTemplateDescriptor['list']>['savedViews']
>[number];

type GeneratedModuleTemplateListAction = NonNullable<
  NonNullable<GeneratedModuleTemplateDescriptor['list']>['rowActions']
>[number];

type GeneratedModuleTemplateField = NonNullable<
  GeneratedModuleTemplateDescriptor['formFields']
>[number];

export type GeneratedModuleFile = {
  path: string;
  content: string;
};

export type GeneratedModuleFileSystem = {
  mkdir: (path: string) => Promise<void>;
  writeFile: (path: string, content: string) => Promise<void>;
};

export type MaterializeGeneratedModuleFilesOptions = GeneratedModuleFileSystem & {
  rootDir: string;
};

export type MaterializeGeneratedModuleFilesResult = {
  writtenPaths: string[];
};

function moduleConstantPrefix(moduleId: string): string {
  return moduleId.replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase();
}

function modulePascalName(moduleId: string): string {
  return moduleId
    .split(/[^a-zA-Z0-9]+/u)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
}

function formatStringArray(values: readonly string[] | undefined): string {
  if (!values?.length) return '[]';
  return `[${values.map((value) => `'${value}'`).join(', ')}]`;
}

function formatOptionalStringProperty(name: string, value: string | undefined): string[] {
  return value ? [`    ${name}: '${value}',`] : [];
}

function formatOptionalBooleanProperty(name: string, value: boolean | undefined): string[] {
  return value === undefined ? [] : [`${name}: ${String(value)}`];
}

function formatColumnDescriptor(column: GeneratedModuleTemplateColumn): string {
  const properties = [
    `key: '${column.key}'`,
    `header: '${column.header}'`,
    ...formatOptionalBooleanProperty('sortable', column.sortable),
    ...(column.type ? [`type: '${column.type}'`] : []),
    ...(column.align ? [`align: '${column.align}'`] : []),
    ...(column.hideBelow ? [`hideBelow: '${column.hideBelow}'`] : []),
  ];

  return `{ ${properties.join(', ')} }`;
}

function formatColumnArray(
  columns: NonNullable<GeneratedModuleTemplateDescriptor['list']>['columns'] | undefined,
  indent = '    ',
): string[] {
  if (!columns?.length) return [];

  return [
    `${indent}columns: [`,
    ...columns.map((column) => `${indent}  ${formatColumnDescriptor(column)},`),
    `${indent}],`,
  ];
}

function formatFilterDescriptor(filter: GeneratedModuleTemplateFilter): string {
  return `{ key: '${filter.key}', label: '${filter.label}', options: ${formatStringArray(filter.options)} }`;
}

function formatFilterArray(
  filters: NonNullable<GeneratedModuleTemplateDescriptor['list']>['filters'] | undefined,
  indent = '    ',
): string[] {
  if (!filters?.length) return [];

  return [
    `${indent}filters: [`,
    ...filters.map((filter) => `${indent}  ${formatFilterDescriptor(filter)},`),
    `${indent}],`,
  ];
}

function formatObjectStringMap(values: Record<string, string>): string {
  const entries = Object.entries(values);
  if (entries.length === 0) return '{}';

  return `{ ${entries.map(([key, value]) => `${key}: '${value}'`).join(', ')} }`;
}

function formatSavedViewDescriptor(savedView: GeneratedModuleTemplateSavedView): string {
  const properties = [
    `id: '${savedView.id}'`,
    `label: '${savedView.label}'`,
    ...formatOptionalBooleanProperty('isDefault', savedView.isDefault),
    `filters: ${formatObjectStringMap(savedView.filters)}`,
  ];

  return `{ ${properties.join(', ')} }`;
}

function formatSavedViewArray(
  savedViews: NonNullable<GeneratedModuleTemplateDescriptor['list']>['savedViews'] | undefined,
  indent = '    ',
): string[] {
  if (!savedViews?.length) return [];

  return [
    `${indent}savedViews: [`,
    ...savedViews.map((savedView) => `${indent}  ${formatSavedViewDescriptor(savedView)},`),
    `${indent}],`,
  ];
}

function formatListActionDescriptor(action: GeneratedModuleTemplateListAction): string {
  const properties = [
    `key: '${action.key}'`,
    `label: '${action.label}'`,
    ...formatOptionalBooleanProperty('destructive', action.destructive),
    ...(action.confirmTitle ? [`confirmTitle: '${action.confirmTitle}'`] : []),
    ...(action.actionLabel ? [`actionLabel: '${action.actionLabel}'`] : []),
  ];

  return `{ ${properties.join(', ')} }`;
}

function formatListActionArray(
  propertyName: 'rowActions' | 'bulkActions',
  actions: NonNullable<GeneratedModuleTemplateDescriptor['list']>[typeof propertyName] | undefined,
  indent = '    ',
): string[] {
  if (!actions?.length) return [];

  return [
    `${indent}${propertyName}: [`,
    ...actions.map((action) => `${indent}  ${formatListActionDescriptor(action)},`),
    `${indent}],`,
  ];
}

function formatFieldDescriptor(field: GeneratedModuleTemplateField): string {
  const properties = [
    `name: '${field.name}'`,
    `label: '${field.label}'`,
    `type: '${field.type}'`,
    ...formatOptionalBooleanProperty('required', field.required),
    ...(field.options?.length ? [`options: ${formatStringArray(field.options)}`] : []),
    ...(field.vocabulary ? [`vocabulary: '${field.vocabulary}'`] : []),
    ...(field.currencySymbol ? [`currencySymbol: '${field.currencySymbol}'`] : []),
    ...(field.section ? [`section: '${field.section}'`] : []),
    ...(field.importance ? [`importance: '${field.importance}'`] : []),
    ...formatOptionalBooleanProperty('inlineEditable', field.inlineEditable),
  ];

  return `{ ${properties.join(', ')} }`;
}

function formatFieldArray(
  propertyName: string,
  fields: readonly GeneratedModuleTemplateField[] | undefined,
  indent = '  ',
): string[] {
  if (!fields?.length) return [];

  return [
    `${indent}${propertyName}: [`,
    ...fields.map((field) => `${indent}  ${formatFieldDescriptor(field)},`),
    `${indent}],`,
  ];
}

function formatDescriptor(descriptor: GeneratedModuleTemplateDescriptor): string {
  const lines = [
    '{',
    `  moduleId: '${descriptor.moduleId}',`,
    `  basePath: '${descriptor.basePath}',`,
    `  apiResource: '${descriptor.apiResource}',`,
  ];

  if (descriptor.list) {
    lines.push(
      '  list: {',
      ...formatOptionalStringProperty('title', descriptor.list.title),
      `    defaultSort: '${descriptor.list.defaultSort}',`,
      `    searchKeys: ${formatStringArray(descriptor.list.searchKeys)},`,
      `    filterKeys: ${formatStringArray(descriptor.list.filterKeys)},`,
      ...formatFilterArray(descriptor.list.filters),
      ...formatSavedViewArray(descriptor.list.savedViews),
      ...formatListActionArray('rowActions', descriptor.list.rowActions),
      ...formatListActionArray('bulkActions', descriptor.list.bulkActions),
      ...formatColumnArray(descriptor.list.columns),
      ...formatOptionalStringProperty('searchPlaceholder', descriptor.list.searchPlaceholder),
      ...formatOptionalStringProperty('entityLabel', descriptor.list.entityLabel),
      ...formatOptionalStringProperty('exportFileName', descriptor.list.exportFileName),
      ...formatOptionalStringProperty('emptyTitle', descriptor.list.emptyTitle),
      '  },',
    );
  }

  if (descriptor.forms?.length) {
    lines.push(`  forms: ${formatStringArray(descriptor.forms)},`);
  }

  lines.push(...formatFieldArray('formFields', descriptor.formFields));

  if (descriptor.detail) {
    lines.push(
      '  detail: {',
      `    tabKeys: ${formatStringArray(descriptor.detail.tabKeys)},`,
      `    relatedRecordKeys: ${formatStringArray(descriptor.detail.relatedRecordKeys)},`,
      ...formatFieldArray('fields', descriptor.detail.fields, '    '),
      '  },',
    );
  }

  lines.push('}');
  return lines.join('\n');
}

export function emitGeneratedModuleFile(
  descriptor: GeneratedModuleTemplateDescriptor,
): GeneratedModuleFile {
  const prefix = moduleConstantPrefix(descriptor.moduleId);
  const descriptorConstant = `GENERATED_${prefix}_MODULE_DESCRIPTOR`;
  const contractConstant = `GENERATED_${prefix}_MODULE_CONTRACT`;

  return {
    path: `src/generated/modules/${descriptor.moduleId}/contract.ts`,
    content: [
      '// Generated by the Oktavius module generator. Do not edit by hand.',
      '',
      'import { assertGeneratedModuleContract } from "../../../lib/generatedModuleContract";',
      'import { emitGeneratedModuleContract, type GeneratedModuleTemplateDescriptor } from "../../../lib/generatedModuleContracts";',
      '',
      `export const ${descriptorConstant} = ${formatDescriptor(descriptor)} satisfies GeneratedModuleTemplateDescriptor;`,
      '',
      `export const ${contractConstant} = emitGeneratedModuleContract(${descriptorConstant});`,
      '',
      `assertGeneratedModuleContract(${contractConstant});`,
      '',
    ].join('\n'),
  };
}

export function emitGeneratedModuleFiles(
  descriptors: readonly GeneratedModuleTemplateDescriptor[],
): GeneratedModuleFile[] {
  return descriptors.map((descriptor) => emitGeneratedModuleFile(descriptor));
}

function generatedModuleDirectory(descriptor: GeneratedModuleTemplateDescriptor): string {
  return `src/generated/modules/${descriptor.moduleId}`;
}

function generatedContractConstant(descriptor: GeneratedModuleTemplateDescriptor): string {
  return `GENERATED_${moduleConstantPrefix(descriptor.moduleId)}_MODULE_CONTRACT`;
}

function formatListPageMetadata(descriptor: GeneratedModuleTemplateDescriptor): string[] {
  const list = descriptor.list;
  if (!list) return [];

  return [
    '  const pageMetadata = {',
    `    title: '${list.title ?? `Generated ${descriptor.moduleId} list`}',`,
    `    searchPlaceholder: '${list.searchPlaceholder ?? `Search ${descriptor.moduleId}`}',`,
    `    entityLabel: '${list.entityLabel ?? descriptor.moduleId}',`,
    `    exportFileName: '${list.exportFileName ?? descriptor.moduleId}',`,
    `    emptyTitle: '${list.emptyTitle ?? `No ${descriptor.moduleId} found`}',`,
    '  };',
    '',
  ];
}

function formatGeneratedColumns(descriptor: GeneratedModuleTemplateDescriptor): string[] {
  const columns = descriptor.list?.columns;

  return [
    '  const generatedColumns = [',
    ...(columns ?? []).map((column) => `    ${formatColumnDescriptor(column)},`),
    '  ] as const;',
    '',
  ];
}

function formatGeneratedFilters(descriptor: GeneratedModuleTemplateDescriptor): string[] {
  const filters =
    descriptor.list?.filters ??
    (descriptor.list?.filterKeys ?? []).map((key) => ({
      key,
      label: `${key.charAt(0).toUpperCase()}${key.slice(1)}`,
      options: [],
    }));

  return [
    '  const generatedFilters = [',
    ...filters.map(
      (filter) =>
        `    { key: '${filter.key}', label: '${filter.label}', options: [${filter.options
          .map((option) => `{ value: '${option}', label: '${option}' }`)
          .join(', ')}] },`,
    ),
    '  ] satisfies FilterDef[];',
    '',
  ];
}

function formatGeneratedSavedViews(descriptor: GeneratedModuleTemplateDescriptor): string[] {
  const savedViews = descriptor.list?.savedViews ?? [];

  return [
    '  const generatedSavedViews = [',
    ...savedViews.map((savedView) => `    ${formatSavedViewDescriptor(savedView)},`),
    '  ] satisfies SavedViewPreset[];',
    '',
  ];
}

function formatGeneratedActionConfirm(
  action: GeneratedModuleTemplateListAction,
  indent = '      ',
): string[] {
  if (!action.confirmTitle) return [];

  return [
    `${indent}confirm: {`,
    `${indent}  title: '${action.confirmTitle}',`,
    ...(action.actionLabel ? [`${indent}  actionLabel: '${action.actionLabel}',`] : []),
    `${indent}},`,
  ];
}

function formatGeneratedRowActions(descriptor: GeneratedModuleTemplateDescriptor): string[] {
  const actions = descriptor.list?.rowActions ?? [];

  return [
    '  const generatedRowActions = [',
    ...actions.flatMap((action) => [
      '    {',
      `      key: '${action.key}',`,
      `      label: '${action.label}',`,
      ...(action.destructive ? ['      destructive: true,'] : []),
      ...formatGeneratedActionConfirm(action),
      '      onClick: (row) => {',
      `        appToast.info(\`${action.label} \${String(row.id)}\`);`,
      '      },',
      '    },',
    ]),
    '  ] satisfies CrudRowAction<GeneratedRecord>[];',
    '',
  ];
}

function formatGeneratedBulkActions(descriptor: GeneratedModuleTemplateDescriptor): string[] {
  const actions = descriptor.list?.bulkActions ?? [];
  const entityLabel = descriptor.list?.entityLabel ?? descriptor.moduleId;

  return [
    '  const generatedBulkActions = [',
    ...actions.flatMap((action) => [
      '    {',
      `      key: '${action.key}',`,
      `      label: '${action.label}',`,
      ...(action.destructive ? ['      destructive: true,'] : []),
      ...formatGeneratedActionConfirm(action),
      '      onClick: (ids) => {',
      `        appToast.info(\`${action.label} \${ids.length} selected ${entityLabel}s\`);`,
      '      },',
      '    },',
    ]),
    '  ] satisfies BulkAction[];',
    '',
  ];
}

function hasGeneratedListActions(descriptor: GeneratedModuleTemplateDescriptor): boolean {
  return Boolean(descriptor.list?.rowActions?.length || descriptor.list?.bulkActions?.length);
}

function formatGeneratedFormFields(descriptor: GeneratedModuleTemplateDescriptor): string[] {
  const fields = descriptor.formFields;

  return [
    '  const generatedFields = [',
    ...(fields ?? []).map((field) => `    ${formatFieldDescriptor(field)},`),
    '  ] as const;',
    '',
  ];
}

function defaultFormValueForField(field: GeneratedModuleTemplateField): string {
  if (field.type === 'checkbox') return 'false';
  if (field.type === 'tags') return '[]';
  return "''";
}

function formatGeneratedDefaults(descriptor: GeneratedModuleTemplateDescriptor): string[] {
  const fields = descriptor.formFields ?? [];

  return [
    '  const generatedDefaults = {',
    ...fields.map((field) => `    ${field.name}: ${defaultFormValueForField(field)},`),
    '  } satisfies Record<string, FormFieldValue>;',
    '',
  ];
}

function formatGeneratedDetailFields(descriptor: GeneratedModuleTemplateDescriptor): string[] {
  const fields = descriptor.detail?.fields;

  return [
    '  const generatedDetailFields = [',
    ...(fields ?? []).map((field) => `    ${formatFieldDescriptor(field)},`),
    '  ] satisfies GeneratedDetailFieldDescriptor[];',
    '',
  ];
}

type FormatGeneratedPageOptions = {
  descriptor: GeneratedModuleTemplateDescriptor;
  pageName: string;
  title: string;
  contractKey: 'list' | 'detail' | 'forms';
  form?: 'create' | 'edit';
};

function formatGeneratedListPage({ descriptor, pageName }: FormatGeneratedPageOptions): string {
  const contractConstant = generatedContractConstant(descriptor);
  const list = descriptor.list;

  return [
    '// Generated by the Oktavius module generator. Do not edit by hand.',
    '',
    "import { useCallback } from 'react';",
    '',
    'import { useApiRegistry } from "../../../api/ApiProvider";',
    'import type { ListResponse } from "../../../api/contracts";',
    'import type { BulkAction, CrudColumn, CrudRowAction } from "../../../components/data/CrudMainView";',
    'import type { FilterDef } from "../../../components/data/FilterToolbar";',
    'import { StandardCrudListPage, type StandardCrudListRequestParams } from "../../../components/data/StandardCrudListPage";',
    'import type { SavedViewPreset } from "../../../components/data/useListSavedViews";',
    ...(hasGeneratedListActions(descriptor)
      ? ['import { appToast } from "../../../lib/toast";']
      : []),
    '',
    `import { ${contractConstant} } from './contract';`,
    '',
    'type GeneratedRecord = { id: string } & Record<string, unknown>;',
    '',
    `export function ${pageName}() {`,
    `  const contract = ${contractConstant};`,
    ...formatListPageMetadata(descriptor),
    ...formatGeneratedColumns(descriptor),
    ...formatGeneratedFilters(descriptor),
    ...formatGeneratedSavedViews(descriptor),
    ...formatGeneratedRowActions(descriptor),
    ...formatGeneratedBulkActions(descriptor),
    `  const generatedCrudColumns = generatedColumns as unknown as CrudColumn<GeneratedRecord>[];`,
    '',
    `  const api = useApiRegistry();`,
    `  const loadRows = useCallback((params: StandardCrudListRequestParams) => api.${descriptor.apiResource}.list(params) as unknown as Promise<ListResponse<GeneratedRecord>>, [api.${descriptor.apiResource}]);`,
    `  const deleteRows = useCallback((ids: string[]) => Promise.all(ids.map((id) => api.${descriptor.apiResource}.delete(id))).then(() => undefined), [api.${descriptor.apiResource}]);`,
    '  const dataScaffold = {',
    `    apiResource: '${descriptor.apiResource}',`,
    '    loadRows,',
    '    deleteRows,',
    '  };',
    '',
    '  return (',
    '    <StandardCrudListPage<GeneratedRecord>',
    '      title={pageMetadata.title}',
    '      subtitle={`${contract.basePath} · ${dataScaffold.apiResource}`}',
    '      rows={[]}',
    '      loadRows={loadRows}',
    '      columns={generatedCrudColumns}',
    '      filters={generatedFilters}',
    '      savedViews={generatedSavedViews}',
    '      rowActions={generatedRowActions}',
    '      bulkActions={generatedBulkActions}',
    `      defaultSort="${list?.defaultSort ?? 'id'}"`,
    `      filterKeys={${formatStringArray(list?.filterKeys)}}`,
    `      searchKeys={${formatStringArray(list?.searchKeys)}}`,
    '      searchPlaceholder={pageMetadata.searchPlaceholder}',
    '      entityLabel={pageMetadata.entityLabel}',
    '      getRowHref={(row) => `${contract.basePath}/${row.id}`}',
    '      onDeleteRows={deleteRows}',
    '      exportFileName={pageMetadata.exportFileName}',
    '      emptyTitle={pageMetadata.emptyTitle}',
    '      emptyDescription="Create or import records to populate this generated module."',
    '    />',
    '  );',
    '}',
    '',
  ].join('\n');
}

function formatGeneratedFormPage({
  descriptor,
  pageName,
  title,
  form,
}: FormatGeneratedPageOptions): string {
  const contractConstant = generatedContractConstant(descriptor);
  const isCreate = form === 'create';

  return [
    '// Generated by the Oktavius module generator. Do not edit by hand.',
    '',
    `import { useCallback${isCreate ? '' : ', useEffect, useState'} } from 'react';`,
    isCreate
      ? "import { useNavigate } from 'react-router-dom';"
      : "import { useNavigate, useParams } from 'react-router-dom';",
    '',
    "import { SectionCard } from '@oktavius/base-ui';",
    '',
    'import { useApiRegistry } from "../../../api/ApiProvider";',
    'import { ModulePage } from "../../../components/common/PageLayout";',
    'import { EntityForm, type FormField, type FormFieldValue } from "../../../components/forms/EntityForm";',
    'import { submitApiForm } from "../../../lib/apiFormSubmit";',
    '',
    `import { ${contractConstant} } from './contract';`,
    '',
    `export function ${pageName}() {`,
    `  const contract = ${contractConstant};`,
    '  const navigate = useNavigate();',
    ...(isCreate ? [] : ['  const params = useParams();', "  const recordId = params.id ?? '';"]),
    ...formatGeneratedFormFields(descriptor),
    ...formatGeneratedDefaults(descriptor),
    ...(isCreate
      ? []
      : [
          '  const [loadedDefaults, setLoadedDefaults] = useState<Record<string, FormFieldValue>>(generatedDefaults);',
          '',
        ]),
    '  const api = useApiRegistry();',
    ...(isCreate
      ? [
          `  const createRecord = useCallback((values: Record<string, unknown>) => api.${descriptor.apiResource}.create(values as never), [api.${descriptor.apiResource}]);`,
          '  const handleSubmit = useCallback(',
          '    (values: Record<string, FormFieldValue>) =>',
          '      submitApiForm({',
          '        action: () => createRecord(values),',
          '        onSuccess: (created) => {',
          '          navigate(`${contract.basePath}/${created.id}`);',
          '        },',
          '      }),',
          '    [contract.basePath, createRecord, navigate],',
          '  );',
        ]
      : [
          `  const loadRecord = useCallback((id: string) => api.${descriptor.apiResource}.get(id), [api.${descriptor.apiResource}]);`,
          `  const updateRecord = useCallback((id: string, values: Record<string, unknown>) => api.${descriptor.apiResource}.update(id, values as never), [api.${descriptor.apiResource}]);`,
          '',
          '  useEffect(() => {',
          '    if (!recordId) return;',
          '    void loadRecord(recordId).then((loaded) => {',
          '      if (loaded) {',
          '        setLoadedDefaults({ ...generatedDefaults, ...(loaded as unknown as Record<string, FormFieldValue>) });',
          '      }',
          '    });',
          '  }, [loadRecord, recordId]);',
          '',
          '  const handleSubmit = useCallback(',
          '    (values: Record<string, FormFieldValue>) =>',
          '      submitApiForm({',
          '        action: () => updateRecord(recordId, values),',
          '        onSuccess: () => {',
          '          navigate(`${contract.basePath}/${recordId}`);',
          '        },',
          '      }),',
          '    [contract.basePath, navigate, recordId, updateRecord],',
          '  );',
        ]),
    '',
    '  return (',
    `    <ModulePage title="${title}" subtitle={contract.basePath}>`,
    '      <EntityForm',
    `        title="${title}"`,
    '        fields={generatedFields as unknown as FormField[]}',
    `        defaultValues={${isCreate ? 'generatedDefaults' : 'loadedDefaults'}}`,
    `        submitLabel="${isCreate ? 'Create record' : 'Save changes'}"`,
    '        warnOnDirty',
    '        onSubmit={handleSubmit}',
    '      />',
    `      <SectionCard title="Generated ${descriptor.moduleId} field descriptors" meta={String(generatedFields.length)}>`,
    '        <pre className="overflow-auto rounded-control bg-muted/40 p-3 text-xs text-muted-foreground">',
    '          {JSON.stringify(generatedFields, null, 2)}',
    '        </pre>',
    '      </SectionCard>',
    '    </ModulePage>',
    '  );',
    '}',
    '',
  ].join('\n');
}

function formatGeneratedDetailPage({
  descriptor,
  pageName,
  title,
}: FormatGeneratedPageOptions): string {
  const contractConstant = generatedContractConstant(descriptor);

  return [
    '// Generated by the Oktavius module generator. Do not edit by hand.',
    '',
    "import { useCallback, useEffect, useMemo, useState } from 'react';",
    "import { useParams } from 'react-router-dom';",
    '',
    'import { useApiRegistry } from "../../../api/ApiProvider";',
    'import { DetailView, type DetailFieldProps } from "../../../components/common/DetailView";',
    'import { ModulePage } from "../../../components/common/PageLayout";',
    '',
    `import { ${contractConstant} } from './contract';`,
    '',
    'type GeneratedRecord = { id: string } & Record<string, unknown>;',
    '',
    'type GeneratedDetailFieldDescriptor = {',
    '  name: string;',
    '  label: string;',
    '  type: string;',
    '  section?: string;',
    "  importance?: DetailFieldProps['importance'];",
    '  inlineEditable?: boolean;',
    '};',
    '',
    'function formatGeneratedFieldValue(value: unknown): string {',
    "  if (value == null || value === '') return '-';",
    "  if (typeof value === 'boolean') return value ? 'Yes' : 'No';",
    '  return String(value);',
    '}',
    '',
    'function formatGeneratedInlineEditValue(value: unknown): string {',
    "  if (value == null) return '';",
    "  if (typeof value === 'boolean') return value ? 'true' : 'false';",
    '  return String(value);',
    '}',
    '',
    "function generatedInlineEditType(type: string): NonNullable<DetailFieldProps['inlineEdit']>['type'] {",
    "  if (type === 'currency' || type === 'decimal') return 'decimal';",
    "  if (type === 'number') return 'number';",
    "  if (type === 'email') return 'email';",
    "  if (type === 'date') return 'date';",
    "  if (type === 'datetime') return 'datetime';",
    "  if (type === 'relation') return 'relation';",
    "  if (type === 'select' || type === 'combobox' || type === 'vocabulary') return 'select';",
    "  return 'text';",
    '}',
    '',
    `export function ${pageName}() {`,
    `  const contract = ${contractConstant};`,
    '  const params = useParams();',
    "  const recordId = params.id ?? '';",
    ...formatGeneratedDetailFields(descriptor),
    '  const [record, setRecord] = useState<GeneratedRecord | null>(null);',
    '',
    '  const api = useApiRegistry();',
    `  const loadRecord = useCallback((id: string) => api.${descriptor.apiResource}.get(id), [api.${descriptor.apiResource}]);`,
    `  const updateRecord = useCallback((id: string, values: Record<string, unknown>) => api.${descriptor.apiResource}.update(id, values as never), [api.${descriptor.apiResource}]);`,
    `  const deleteRecord = useCallback((id: string) => api.${descriptor.apiResource}.delete(id), [api.${descriptor.apiResource}]);`,
    '',
    '  useEffect(() => {',
    '    if (!recordId) return;',
    '    void loadRecord(recordId).then((loaded) => {',
    '      setRecord(loaded as GeneratedRecord | null);',
    '    });',
    '  }, [loadRecord, recordId]);',
    '',
    '  const detailFields = useMemo<DetailFieldProps[]>(() =>',
    '    generatedDetailFields.map((field) => ({',
    '      label: field.label,',
    '      value: formatGeneratedFieldValue(record?.[field.name]),',
    "      section: 'section' in field ? field.section : undefined,",
    "      importance: 'importance' in field ? field.importance : undefined,",
    '      inlineEdit: field.inlineEditable',
    '        ? {',
    '            value: formatGeneratedInlineEditValue(record?.[field.name]),',
    '            type: generatedInlineEditType(field.type),',
    '            onSave: async (value) => {',
    '              await updateRecord(recordId, { [field.name]: value });',
    '              setRecord((current) => (current ? { ...current, [field.name]: value } : current));',
    '            },',
    '          }',
    '        : undefined,',
    '    })),',
    '    [record, recordId, updateRecord],',
    '  );',
    '',
    '  const dataScaffold = {',
    `    apiResource: '${descriptor.apiResource}',`,
    '    loadRecord,',
    '    updateRecord,',
    '    deleteRecord,',
    '  };',
    '',
    '  return (',
    `    <ModulePage title="${title}" subtitle={\`\${contract.basePath} · \${dataScaffold.apiResource}\`}>`,
    `      <DetailView title="${title}" fields={detailFields} />`,
    '    </ModulePage>',
    '  );',
    '}',
    '',
  ].join('\n');
}

function formatGeneratedPage(options: FormatGeneratedPageOptions): string {
  if (options.contractKey === 'list') return formatGeneratedListPage(options);
  if (options.contractKey === 'forms') return formatGeneratedFormPage(options);
  return formatGeneratedDetailPage(options);
}

function routeElementImport(pageName: string, fileName: string): string {
  return `import { ${pageName} } from './${fileName}';`;
}

function formatRouteFile(
  descriptor: GeneratedModuleTemplateDescriptor,
  pages: Array<{ path: string; pageName: string; fileName: string }>,
): string {
  const constantName = `GENERATED_${moduleConstantPrefix(descriptor.moduleId)}_ROUTES`;

  return [
    '// Generated by the Oktavius module generator. Do not edit by hand.',
    '',
    "import type { RouteObject } from 'react-router-dom';",
    '',
    ...pages.map((page) => routeElementImport(page.pageName, page.fileName)),
    '',
    `export const ${constantName} = [`,
    ...pages.map((page) => `  { path: '${page.path}', element: <${page.pageName} /> },`),
    '] satisfies RouteObject[];',
    '',
  ].join('\n');
}

export function emitGeneratedModuleRouteFiles(
  descriptor: GeneratedModuleTemplateDescriptor,
): GeneratedModuleFile[] {
  const directory = generatedModuleDirectory(descriptor);
  const moduleName = modulePascalName(descriptor.moduleId);
  const files: GeneratedModuleFile[] = [];
  const pages: Array<{ path: string; pageName: string; fileName: string }> = [];

  if (descriptor.list) {
    const pageName = `Generated${moduleName}ListPage`;
    files.push({
      path: `${directory}/list-page.tsx`,
      content: formatGeneratedPage({
        descriptor,
        pageName,
        title: `Generated ${descriptor.moduleId} list`,
        contractKey: 'list',
      }),
    });
    pages.push({ path: descriptor.basePath, pageName, fileName: 'list-page' });
  }

  if (descriptor.detail) {
    const pageName = `Generated${moduleName}DetailPage`;
    files.push({
      path: `${directory}/detail-page.tsx`,
      content: formatGeneratedPage({
        descriptor,
        pageName,
        title: `Generated ${descriptor.moduleId} detail`,
        contractKey: 'detail',
      }),
    });
    pages.push({ path: `${descriptor.basePath}/:id`, pageName, fileName: 'detail-page' });
  }

  for (const form of descriptor.forms ?? []) {
    const pageName = `Generated${moduleName}${form === 'create' ? 'Create' : 'Edit'}Page`;
    const fileName = `${form}-page`;
    files.push({
      path: `${directory}/${fileName}.tsx`,
      content: formatGeneratedPage({
        descriptor,
        pageName,
        title: `Generated ${descriptor.moduleId} ${form}`,
        contractKey: 'forms',
        form,
      }),
    });
    pages.push({
      path: form === 'create' ? `${descriptor.basePath}/new` : `${descriptor.basePath}/:id/edit`,
      pageName,
      fileName,
    });
  }

  files.push({
    path: `${directory}/routes.tsx`,
    content: formatRouteFile(descriptor, pages),
  });

  return files;
}

export function emitGeneratedModuleScaffoldFiles(
  descriptors: readonly GeneratedModuleTemplateDescriptor[],
): GeneratedModuleFile[] {
  return descriptors.flatMap((descriptor) => [
    emitGeneratedModuleFile(descriptor),
    ...emitGeneratedModuleRouteFiles(descriptor),
  ]);
}

function trimTrailingSlash(path: string): string {
  return path.replace(/\/+$/u, '');
}

function dirname(path: string): string {
  return path.slice(0, path.lastIndexOf('/'));
}

function joinPath(rootDir: string, path: string): string {
  return `${trimTrailingSlash(rootDir)}/${path.replace(/^\/+/u, '')}`;
}

export async function materializeGeneratedModuleFiles(
  files: readonly GeneratedModuleFile[],
  options: MaterializeGeneratedModuleFilesOptions,
): Promise<MaterializeGeneratedModuleFilesResult> {
  const writtenPaths: string[] = [];

  for (const file of files) {
    const targetPath = joinPath(options.rootDir, file.path);
    await options.mkdir(dirname(targetPath));
    await options.writeFile(targetPath, file.content);
    writtenPaths.push(targetPath);
  }

  return { writtenPaths };
}
