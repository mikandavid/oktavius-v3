import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

import { validateGeneratedModuleContract } from './generatedModuleContract';
import {
  emitGeneratedModuleContract,
  GENERATED_MODULE_TEMPLATE_DESCRIPTORS,
} from './generatedModuleContracts';
import {
  emitGeneratedModuleFile,
  emitGeneratedModuleFiles,
  emitGeneratedModuleRouteFiles,
  emitGeneratedModuleScaffoldFiles,
  materializeGeneratedModuleFiles,
} from './generatedModuleFiles';

const execFileAsync = promisify(execFile);

describe('generated module file emitter', () => {
  it('emits a deterministic contract file for a module descriptor', () => {
    const file = emitGeneratedModuleFile(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[0]);

    expect(file.path).toBe('src/generated/modules/clients/contract.ts');
    expect(file.content).toContain('GENERATED_CLIENTS_MODULE_DESCRIPTOR');
    expect(file.content).toContain("moduleId: 'clients'");
    expect(file.content).toContain("searchPlaceholder: 'Search clients'");
    expect(file.content).toContain("{ key: 'name', header: 'Name', sortable: true }");
    expect(file.content).toContain(
      "{ key: 'contractEnd', header: 'Contract end', sortable: true, type: 'date', hideBelow: 'lg' }",
    );
    expect(file.content).toContain("'assistant'");
    expect(file.content).toContain(
      'assertGeneratedModuleContract(GENERATED_CLIENTS_MODULE_CONTRACT);',
    );
  });

  it('emits one unique module file per current generated descriptor', () => {
    const files = emitGeneratedModuleFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS);

    expect(files).toHaveLength(GENERATED_MODULE_TEMPLATE_DESCRIPTORS.length);
    expect(new Set(files.map((file) => file.path)).size).toBe(files.length);
    expect(files.map((file) => file.path)).toContain('src/generated/modules/projects/contract.ts');
  });

  it('emits route and page scaffold files from descriptor capabilities', () => {
    const files = emitGeneratedModuleRouteFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[0]);

    expect(files.map((file) => file.path)).toEqual([
      'src/generated/modules/clients/list-page.tsx',
      'src/generated/modules/clients/detail-page.tsx',
      'src/generated/modules/clients/create-page.tsx',
      'src/generated/modules/clients/edit-page.tsx',
      'src/generated/modules/clients/routes.tsx',
    ]);
    expect(files[0].content).toContain('GeneratedClientsListPage');
    expect(files[0].content).toContain("title: 'Clients'");
    expect(files[0].content).toContain("entityLabel: 'client'");
    expect(files[0].content).toContain("emptyTitle: 'No clients found'");
    expect(files[0].content).toContain('const generatedColumns =');
    expect(files[0].content).toContain("key: 'contractEnd'");
    expect(files[1].content).toContain('GeneratedClientsDetailPage');
    expect(files[4].content).toContain('GENERATED_CLIENTS_ROUTES');
    expect(files[4].content).toContain("path: '/clients/:id/edit'");
  });

  it('emits generated form field descriptors for form-capable modules', () => {
    const productContractFile = emitGeneratedModuleFile(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const routeFiles = emitGeneratedModuleRouteFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const createPage = routeFiles.find((file) => file.path.endsWith('/create-page.tsx'));

    expect(productContractFile.content).toContain('formFields: [');
    expect(productContractFile.content).toContain(
      "{ name: 'sku', label: 'SKU', type: 'text', required: true, section: 'Product' }",
    );
    expect(productContractFile.content).toContain(
      "{ name: 'price', label: 'Price', type: 'currency', currencySymbol: '€', section: 'Pricing' }",
    );
    expect(createPage?.content).toContain('const generatedFields =');
    expect(createPage?.content).toContain('title="Generated products field descriptors"');
    expect(createPage?.content).toContain("name: 'category'");
  });

  it('emits generated detail field descriptors for detail-capable modules', () => {
    const productContractFile = emitGeneratedModuleFile(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const routeFiles = emitGeneratedModuleRouteFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const detailPage = routeFiles.find((file) => file.path.endsWith('/detail-page.tsx'));

    expect(productContractFile.content).toContain('fields: [');
    expect(productContractFile.content).toContain(
      "{ name: 'name', label: 'Name', type: 'text', importance: 'primary', inlineEditable: true }",
    );
    expect(productContractFile.content).toContain(
      "{ name: 'price', label: 'Price', type: 'currency', section: 'Pricing', inlineEditable: true }",
    );
    expect(detailPage?.content).toContain('const generatedDetailFields =');
    expect(detailPage?.content).toContain('<DetailView title="Generated products detail"');
    expect(detailPage?.content).toContain("label: 'Stock'");
  });

  it('emits generated frontend API loader scaffolds for list pages', () => {
    const routeFiles = emitGeneratedModuleRouteFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const listPage = routeFiles.find((file) => file.path.endsWith('/list-page.tsx'));

    expect(listPage?.content).toContain("import { useCallback } from 'react';");
    expect(listPage?.content).toContain(
      'import { useApiRegistry } from "../../../api/ApiProvider";',
    );
    expect(listPage?.content).toContain(
      'import type { ListResponse } from "../../../api/contracts";',
    );
    expect(listPage?.content).toContain(
      'import { StandardCrudListPage, type StandardCrudListRequestParams } from "../../../components/data/StandardCrudListPage";',
    );
    expect(listPage?.content).toContain('const api = useApiRegistry();');
    expect(listPage?.content).toContain('api.products.list(params)');
    expect(listPage?.content).toContain(
      'const deleteRows = useCallback((ids: string[]) => Promise.all(ids.map((id) => api.products.delete(id))).then(() => undefined), [api.products]);',
    );
    expect(listPage?.content).toContain("apiResource: 'products'");
  });

  it('emits generated frontend API record and form action scaffolds', () => {
    const routeFiles = emitGeneratedModuleRouteFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const detailPage = routeFiles.find((file) => file.path.endsWith('/detail-page.tsx'));
    const createPage = routeFiles.find((file) => file.path.endsWith('/create-page.tsx'));
    const editPage = routeFiles.find((file) => file.path.endsWith('/edit-page.tsx'));

    expect(detailPage?.content).toContain(
      'const loadRecord = useCallback((id: string) => api.products.get(id), [api.products]);',
    );
    expect(detailPage?.content).toContain(
      'const updateRecord = useCallback((id: string, values: Record<string, unknown>) => api.products.update(id, values as never), [api.products]);',
    );
    expect(detailPage?.content).toContain(
      'const deleteRecord = useCallback((id: string) => api.products.delete(id), [api.products]);',
    );
    expect(createPage?.content).toContain(
      'const createRecord = useCallback((values: Record<string, unknown>) => api.products.create(values as never), [api.products]);',
    );
    expect(editPage?.content).toContain(
      'const updateRecord = useCallback((id: string, values: Record<string, unknown>) => api.products.update(id, values as never), [api.products]);',
    );
  });

  it('emits generated list pages as StandardCrudListPage runtime shells', () => {
    const routeFiles = emitGeneratedModuleRouteFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const listPage = routeFiles.find((file) => file.path.endsWith('/list-page.tsx'));

    expect(listPage?.content).toContain(
      'import { StandardCrudListPage, type StandardCrudListRequestParams } from "../../../components/data/StandardCrudListPage";',
    );
    expect(listPage?.content).toContain(
      'import type { BulkAction, CrudColumn, CrudRowAction } from "../../../components/data/CrudMainView";',
    );
    expect(listPage?.content).toContain('const generatedFilters = [');
    expect(listPage?.content).toContain('<StandardCrudListPage<GeneratedRecord>');
    expect(listPage?.content).toContain('rows={[]}');
    expect(listPage?.content).toContain('loadRows={loadRows}');
    expect(listPage?.content).toContain('onDeleteRows={deleteRows}');
    expect(listPage?.content).toContain('getRowHref={(row) => `${contract.basePath}/${row.id}`}');
  });

  it('emits generated list filter descriptors with concrete options', () => {
    const productContractFile = emitGeneratedModuleFile(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const routeFiles = emitGeneratedModuleRouteFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const listPage = routeFiles.find((file) => file.path.endsWith('/list-page.tsx'));

    expect(productContractFile.content).toContain('filters: [');
    expect(productContractFile.content).toContain(
      "{ key: 'status', label: 'Status', options: ['Active', 'Discontinued', 'Draft'] }",
    );
    expect(productContractFile.content).toContain(
      "{ key: 'category', label: 'Category', options: ['Licenses', 'Services', 'Hardware'] }",
    );
    expect(listPage?.content).toContain(
      "{ key: 'status', label: 'Status', options: [{ value: 'Active', label: 'Active' }, { value: 'Discontinued', label: 'Discontinued' }, { value: 'Draft', label: 'Draft' }] },",
    );
    expect(listPage?.content).not.toContain("key: 'status', label: 'Status', options: []");
  });

  it('emits generated saved-view descriptors for list pages', () => {
    const productContractFile = emitGeneratedModuleFile(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const routeFiles = emitGeneratedModuleRouteFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const listPage = routeFiles.find((file) => file.path.endsWith('/list-page.tsx'));

    expect(productContractFile.content).toContain('savedViews: [');
    expect(productContractFile.content).toContain(
      "{ id: 'all', label: 'All products', isDefault: true, filters: { status: '', category: '' } }",
    );
    expect(productContractFile.content).toContain(
      "{ id: 'licenses', label: 'Licenses', filters: { status: '', category: 'Licenses' } }",
    );
    expect(listPage?.content).toContain('const generatedSavedViews = [');
    expect(listPage?.content).toContain('savedViews={generatedSavedViews}');
    expect(listPage?.content).toContain("label: 'Services'");
  });

  it('emits generated list action descriptors for list pages', () => {
    const productContractFile = emitGeneratedModuleFile(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const routeFiles = emitGeneratedModuleRouteFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const listPage = routeFiles.find((file) => file.path.endsWith('/list-page.tsx'));

    expect(productContractFile.content).toContain('rowActions: [');
    expect(productContractFile.content).toContain("{ key: 'duplicate', label: 'Duplicate' }");
    expect(productContractFile.content).toContain('bulkActions: [');
    expect(productContractFile.content).toContain(
      "{ key: 'archive', label: 'Archive selected', destructive: true, confirmTitle: 'Archive selected products?' }",
    );
    expect(listPage?.content).toContain(
      'import type { BulkAction, CrudColumn, CrudRowAction } from "../../../components/data/CrudMainView";',
    );
    expect(listPage?.content).toContain('import { appToast } from "../../../lib/toast";');
    expect(listPage?.content).toContain('const generatedRowActions = [');
    expect(listPage?.content).toContain('appToast.info(`Duplicate ${String(row.id)}`);');
    expect(listPage?.content).toContain('const generatedBulkActions = [');
    expect(listPage?.content).toContain(
      'appToast.info(`Archive selected ${ids.length} selected products`);',
    );
    expect(listPage?.content).toContain('rowActions={generatedRowActions}');
    expect(listPage?.content).toContain('bulkActions={generatedBulkActions}');
  });

  it('emits generated form pages as EntityForm runtime shells', () => {
    const routeFiles = emitGeneratedModuleRouteFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const createPage = routeFiles.find((file) => file.path.endsWith('/create-page.tsx'));
    const editPage = routeFiles.find((file) => file.path.endsWith('/edit-page.tsx'));

    expect(createPage?.content).toContain("import { useNavigate } from 'react-router-dom';");
    expect(editPage?.content).toContain(
      "import { useNavigate, useParams } from 'react-router-dom';",
    );
    expect(createPage?.content).toContain(
      'import { EntityForm, type FormField, type FormFieldValue } from "../../../components/forms/EntityForm";',
    );
    expect(createPage?.content).toContain(
      'import { submitApiForm } from "../../../lib/apiFormSubmit";',
    );
    expect(createPage?.content).toContain('<EntityForm');
    expect(createPage?.content).toContain('fields={generatedFields as unknown as FormField[]}');
    expect(createPage?.content).toContain('defaultValues={generatedDefaults}');
    expect(createPage?.content).toContain('onSubmit={handleSubmit}');
    expect(createPage?.content).toContain('navigate(`${contract.basePath}/${created.id}`);');
    expect(editPage?.content).toContain("const recordId = params.id ?? '';");
    expect(editPage?.content).toContain('navigate(`${contract.basePath}/${recordId}`);');
  });

  it('emits generated detail pages as DetailView runtime shells', () => {
    const routeFiles = emitGeneratedModuleRouteFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[1]);
    const detailPage = routeFiles.find((file) => file.path.endsWith('/detail-page.tsx'));

    expect(detailPage?.content).toContain(
      "import { useCallback, useEffect, useMemo, useState } from 'react';",
    );
    expect(detailPage?.content).toContain("import { useParams } from 'react-router-dom';");
    expect(detailPage?.content).toContain(
      'import { DetailView, type DetailFieldProps } from "../../../components/common/DetailView";',
    );
    expect(detailPage?.content).toContain(
      'const [record, setRecord] = useState<GeneratedRecord | null>(null);',
    );
    expect(detailPage?.content).toContain('void loadRecord(recordId).then((loaded) => {');
    expect(detailPage?.content).toContain('const detailFields = useMemo<DetailFieldProps[]>(() =>');
    expect(detailPage?.content).toContain('      inlineEdit: field.inlineEditable');
    expect(detailPage?.content).toContain('        ? {');
    expect(detailPage?.content).toContain(
      '            value: formatGeneratedInlineEditValue(record?.[field.name]),',
    );
    expect(detailPage?.content).toContain('            type: generatedInlineEditType(field.type),');
    expect(detailPage?.content).toContain('            onSave: async (value) => {');
    expect(detailPage?.content).toContain(
      '              await updateRecord(recordId, { [field.name]: value });',
    );
    expect(detailPage?.content).toContain(
      '              setRecord((current) => (current ? { ...current, [field.name]: value } : current));',
    );
    expect(detailPage?.content).toContain(
      '<DetailView title="Generated products detail" fields={detailFields} />',
    );
  });

  it('emits contract plus route/page scaffold artifacts for every generated descriptor', () => {
    const files = emitGeneratedModuleScaffoldFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS);
    const paths = files.map((file) => file.path);

    expect(paths).toContain('src/generated/modules/clients/contract.ts');
    expect(paths).toContain('src/generated/modules/clients/routes.tsx');
    expect(paths).toContain('src/generated/modules/users/create-page.tsx');
    expect(paths).toContain('src/generated/modules/orders/detail-page.tsx');
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('omits form pages when a descriptor does not declare generated forms', () => {
    const files = emitGeneratedModuleRouteFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS[4]);

    expect(files.map((file) => file.path)).toEqual([
      'src/generated/modules/orders/list-page.tsx',
      'src/generated/modules/orders/detail-page.tsx',
      'src/generated/modules/orders/routes.tsx',
    ]);
  });

  it('emits descriptors whose contracts satisfy the generation contract', () => {
    const violations = GENERATED_MODULE_TEMPLATE_DESCRIPTORS.flatMap((descriptor) =>
      validateGeneratedModuleContract(emitGeneratedModuleContract(descriptor)),
    );

    expect(violations).toEqual([]);
  });

  it('materializes generated files through an injected filesystem adapter', async () => {
    const operations: string[] = [];
    const files = emitGeneratedModuleFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS.slice(0, 2));

    const result = await materializeGeneratedModuleFiles(files, {
      rootDir: '/workspace/apps/web',
      mkdir: async (path) => {
        operations.push(`mkdir:${path}`);
      },
      writeFile: async (path, content) => {
        operations.push(`write:${path}:${content.includes('assertGeneratedModuleContract')}`);
      },
    });

    expect(result.writtenPaths).toEqual([
      '/workspace/apps/web/src/generated/modules/clients/contract.ts',
      '/workspace/apps/web/src/generated/modules/products/contract.ts',
    ]);
    expect(operations).toEqual([
      'mkdir:/workspace/apps/web/src/generated/modules/clients',
      'write:/workspace/apps/web/src/generated/modules/clients/contract.ts:true',
      'mkdir:/workspace/apps/web/src/generated/modules/products',
      'write:/workspace/apps/web/src/generated/modules/products/contract.ts:true',
    ]);
  });

  it('writes generated files to a real filesystem target', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'oktavius-generated-modules-'));

    try {
      const files = emitGeneratedModuleFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS.slice(0, 1));
      const result = await materializeGeneratedModuleFiles(files, {
        rootDir,
        mkdir: (path) => mkdir(path, { recursive: true }).then(() => undefined),
        writeFile,
      });

      expect(result.writtenPaths).toEqual([
        join(rootDir, 'src/generated/modules/clients/contract.ts'),
      ]);
      await expect(readFile(result.writtenPaths[0], 'utf8')).resolves.toContain(
        'GENERATED_CLIENTS_MODULE_CONTRACT',
      );
    } finally {
      await rm(rootDir, { force: true, recursive: true });
    }
  });

  it('materializes current generated contracts through the generator command', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'oktavius-generated-cli-'));

    try {
      const { stdout } = await execFileAsync(
        process.execPath,
        ['--experimental-strip-types', 'scripts/generate-module-contracts.ts', '--root', rootDir],
        { cwd: process.cwd() },
      );

      expect(stdout).toContain('Generated 9 module contract files.');
      await expect(
        readFile(join(rootDir, 'src/generated/modules/clients/contract.ts'), 'utf8'),
      ).resolves.toContain('GENERATED_CLIENTS_MODULE_CONTRACT');
    } finally {
      await rm(rootDir, { force: true, recursive: true });
    }
  });

  it('materializes current generated scaffolds through the module generator command', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'oktavius-generated-module-cli-'));

    try {
      const { stdout } = await execFileAsync(
        process.execPath,
        ['--experimental-strip-types', 'scripts/generate-modules.ts', '--root', rootDir],
        { cwd: process.cwd() },
      );

      expect(stdout).toContain('Generated 44 module files.');
      await expect(
        readFile(join(rootDir, 'src/generated/modules/clients/routes.tsx'), 'utf8'),
      ).resolves.toContain('GENERATED_CLIENTS_ROUTES');
      await expect(
        readFile(join(rootDir, 'src/generated/modules/orders/detail-page.tsx'), 'utf8'),
      ).resolves.toContain('GeneratedOrdersDetailPage');
    } finally {
      await rm(rootDir, { force: true, recursive: true });
    }
  });
});
