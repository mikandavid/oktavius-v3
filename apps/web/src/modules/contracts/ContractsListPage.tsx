import { useCallback } from 'react';

import { useApiRegistry } from '@/api/ApiProvider';
import { useDemoData } from '@/app/demo-data';
import {
  StandardCrudListPage,
  type StandardCrudListRequestParams,
} from '@/components/data/StandardCrudListPage';

import {
  CONTRACT_SAVED_VIEWS,
  contractColumns,
  contractFilters,
  contractsPageIcon,
} from './shared';

export function ContractsListPage() {
  const api = useApiRegistry();
  const { contracts } = useDemoData();
  const loadContracts = useCallback(
    (params: StandardCrudListRequestParams) => api.contracts.list(params),
    [api.contracts],
  );

  return (
    <StandardCrudListPage
      title="Contracts"
      subtitle="Agreements, renewals, and commercial terms"
      icon={contractsPageIcon()}
      rows={contracts}
      loadRows={loadContracts}
      columns={contractColumns}
      filters={contractFilters}
      savedViews={CONTRACT_SAVED_VIEWS}
      defaultSort="contractNumber"
      filterKeys={['status', 'clientName', 'owner']}
      searchKeys={['contractNumber', 'title', 'clientName', 'owner']}
      searchPlaceholder="Search contracts"
      entityLabel="contract"
      getRowHref={(row) => `/contracts/${row.id}`}
      onDeleteRows={(ids) =>
        Promise.all(ids.map((id) => api.contracts.delete(id))).then(() => undefined)
      }
      exportFileName="contracts"
      emptyTitle="No contracts found"
      emptyDescription="Adjust your filters or search terms."
    />
  );
}
