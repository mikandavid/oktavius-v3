import { useCallback } from 'react';

import { useApiRegistry } from '@/api/ApiProvider';
import { useDemoData } from '@/app/demo-data';
import {
  StandardCrudListPage,
  type StandardCrudListRequestParams,
} from '@/components/data/StandardCrudListPage';

import { PROJECT_SAVED_VIEWS, projectColumns, projectFilters, projectsPageIcon } from './shared';

export function ProjectsListPage() {
  const api = useApiRegistry();
  const { projects } = useDemoData();
  const loadProjects = useCallback(
    (params: StandardCrudListRequestParams) => api.projects.list(params),
    [api.projects],
  );

  return (
    <StandardCrudListPage
      title="Projects"
      subtitle="Delivery initiatives and milestones"
      icon={projectsPageIcon()}
      rows={projects}
      loadRows={loadProjects}
      columns={projectColumns}
      filters={projectFilters}
      savedViews={PROJECT_SAVED_VIEWS}
      defaultSort="name"
      filterKeys={['status', 'manager', 'clientName']}
      searchKeys={['name', 'clientName', 'manager']}
      searchPlaceholder="Search projects"
      entityLabel="project"
      getRowHref={(row) => `/projects/${row.id}`}
      onDeleteRows={(ids) =>
        Promise.all(ids.map((id) => api.projects.delete(id))).then(() => undefined)
      }
      exportFileName="projects"
      emptyTitle="No projects found"
      emptyDescription="Adjust your filters or search terms."
    />
  );
}
