import { useCallback } from 'react';

import { useApiRegistry } from '@/api/ApiProvider';
import { useDemoData } from '@/app/demo-data';
import {
  StandardCrudListPage,
  type StandardCrudListRequestParams,
} from '@/components/data/StandardCrudListPage';

import { CasesHeaderAction, casesPageIcon } from './shared';
import { useCasesModuleConfig } from './useCasesModuleConfig';

export function CasesListPage() {
  const api = useApiRegistry();
  const { cases } = useDemoData();
  const moduleConfig = useCasesModuleConfig();
  const loadCases = useCallback(
    (params: StandardCrudListRequestParams) => api.cases.list(params),
    [api.cases],
  );

  return (
    <StandardCrudListPage
      title={moduleConfig.listTitle}
      subtitle={moduleConfig.listSubtitle}
      icon={casesPageIcon()}
      headerActions={
        <CasesHeaderAction
          basePath={moduleConfig.basePath}
          boardLabel={moduleConfig.boardLabel}
          newLabel={moduleConfig.newLabel}
        />
      }
      rows={cases}
      loadRows={loadCases}
      columns={moduleConfig.columns}
      filters={moduleConfig.filters}
      savedViews={moduleConfig.savedViews}
      defaultSort="caseNumber"
      filterKeys={['type', 'stage', 'priority']}
      searchKeys={['caseNumber', 'title', 'clientName', 'assignee', 'summary']}
      searchPlaceholder={`Search ${moduleConfig.listTitle.toLowerCase()}`}
      entityLabel="case"
      getRowHref={(row) => `${moduleConfig.basePath}/${row.id}`}
      onDeleteRows={(ids) =>
        Promise.all(ids.map((id) => api.cases.delete(id))).then(() => undefined)
      }
      exportFileName="cases"
      emptyTitle="No cases found"
      emptyDescription="Create a case or adjust your filters."
    />
  );
}
