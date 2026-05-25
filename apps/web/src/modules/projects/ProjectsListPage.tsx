import { useEffect, useState } from 'react';

import { CrudMainView } from '@/components/data/CrudMainView';
import { useDemoData } from '@/app/demo-data';
import { useListPageState } from '@/lib/useListPageState';

import { projectColumns, projectFilters, projectsPageIcon } from './shared';

export function ProjectsListPage() {
  const { projects } = useDemoData();
  const [rows, setRows] = useState(projects);

  useEffect(() => {
    setRows(projects);
  }, [projects]);

  const list = useListPageState({
    rows,
    defaultSort: 'name',
    filterKeys: ['status', 'manager', 'clientName'],
    searchKeys: ['name', 'clientName', 'manager'],
  });

  return (
    <CrudMainView
      title="Projects"
      subtitle="Delivery initiatives and milestones"
      icon={projectsPageIcon()}
      columns={projectColumns}
      rows={list.paged}
      sort={list.sort}
      onSortChange={list.onSortChange}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search projects"
      filters={projectFilters}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
      entityLabel="project"
      getRowHref={(row) => `/projects/${row.id}`}
      onDeleteRows={(ids) => setRows((current) => current.filter((row) => !ids.includes(row.id)))}
      exportOptions={{ fileName: 'projects', label: 'Export' }}
      allRows={list.filtered}
      emptyTitle="No projects found"
      emptyDescription="Adjust your filters or search terms."
    />
  );
}
