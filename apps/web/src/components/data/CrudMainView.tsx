import type { ReactNode } from 'react';
import { useState } from 'react';

import { PageHeaderActions, PageHeaderExportButton } from '@/components/common/PageHeaderButtons';
import { ModulePage } from '@/components/common/PageLayout';

import { CrudListShell, type CrudListShellProps } from './CrudListShell';
import { type BulkAction, type CrudColumn, type CrudRowAction } from './CrudTable';
import { exportToXlsx } from './exportGrid';
import {
  chooseExportStrategy,
  exportColumnsForRuntime,
  type ExportRuntimeAdapter,
} from './exportRuntime';

export type { BulkAction, CrudColumn, CrudRowAction };
export { CrudListShell } from './CrudListShell';
export { buildStandardListCrudActions } from './standardListCrud';

type ExportOptions = {
  fileName: string;
  sheetName?: string;
  label?: string;
  onExport?: () => void | Promise<void>;
  runtime?: ExportRuntimeAdapter;
  resourceKey?: string;
  rowCountThreshold?: number;
  filters?: Record<string, string>;
  search?: string;
  sort?: string;
};

type CrudMainViewProps<T extends { id: string }> = CrudListShellProps<T> & {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  headerActions?: ReactNode;
  allRows?: T[];
  exportOptions?: ExportOptions;
};

export function CrudMainView<T extends { id: string }>({
  title,
  subtitle,
  icon,
  headerActions,
  allRows,
  exportOptions,
  rows,
  columns,
  isLoading,
  ...shellProps
}: CrudMainViewProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!exportOptions) return;
    setIsExporting(true);
    try {
      if (exportOptions.onExport) {
        await exportOptions.onExport();
      } else {
        const exportData = (allRows ?? rows) as unknown as Record<string, unknown>[];
        const strategy = chooseExportStrategy({
          runtime: exportOptions.runtime,
          rowCount: exportData.length,
          threshold: exportOptions.rowCountThreshold,
        });

        if (strategy === 'server' && exportOptions.runtime) {
          await exportOptions.runtime.startExport({
            resourceKey: exportOptions.resourceKey ?? exportOptions.fileName,
            fileName: exportOptions.fileName,
            columns: exportColumnsForRuntime(
              columns as unknown as CrudColumn<Record<string, unknown>>[],
            ),
            filters: exportOptions.filters,
            search: exportOptions.search,
            sort: exportOptions.sort,
          });
          return;
        }

        await exportToXlsx(
          exportData,
          columns as unknown as CrudColumn<Record<string, unknown>>[],
          exportOptions.fileName,
          exportOptions.sheetName,
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  const resolvedHeaderActions =
    exportOptions || headerActions ? (
      <PageHeaderActions>
        {exportOptions ? (
          <PageHeaderExportButton
            label={exportOptions.label ?? 'Export'}
            disabled={isLoading || rows.length === 0 || isExporting}
            isLoading={isExporting}
            onClick={() => void handleExport()}
          />
        ) : null}
        {headerActions}
      </PageHeaderActions>
    ) : undefined;

  return (
    <ModulePage
      title={title}
      subtitle={subtitle}
      icon={icon}
      actions={resolvedHeaderActions}
      layoutClassName="min-w-0 w-full max-w-full"
    >
      <CrudListShell rows={rows} columns={columns} isLoading={isLoading} {...shellProps} />
    </ModulePage>
  );
}
