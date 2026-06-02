import { useCallback } from 'react';

import { useApiRegistry } from '@/api/ApiProvider';
import { useDemoData } from '@/app/demo-data';
import {
  StandardCrudListPage,
  type StandardCrudListRequestParams,
} from '@/components/data/StandardCrudListPage';

import {
  INCIDENT_SAVED_VIEWS,
  incidentColumns,
  incidentFilters,
  incidentsPageIcon,
} from './shared';

export function IncidentsListPage() {
  const api = useApiRegistry();
  const { incidents } = useDemoData();
  const loadIncidents = useCallback(
    (params: StandardCrudListRequestParams) => api.incidents.list(params),
    [api.incidents],
  );

  return (
    <StandardCrudListPage
      title="Incidents"
      subtitle="Operational incidents and service disruptions"
      icon={incidentsPageIcon()}
      rows={incidents}
      loadRows={loadIncidents}
      columns={incidentColumns}
      filters={incidentFilters}
      savedViews={INCIDENT_SAVED_VIEWS}
      defaultSort="reportedAt"
      filterKeys={['severity', 'status', 'service']}
      searchKeys={['incidentNumber', 'title', 'service', 'assignee', 'impact']}
      searchPlaceholder="Search incidents"
      entityLabel="incident"
      getRowHref={(row) => `/incidents/${row.id}`}
      onDeleteRows={(ids) =>
        Promise.all(ids.map((id) => api.incidents.delete(id))).then(() => undefined)
      }
      exportFileName="incidents"
      emptyTitle="No incidents found"
      emptyDescription="Adjust your filters or search terms."
    />
  );
}
