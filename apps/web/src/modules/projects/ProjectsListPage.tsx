import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { useListPageState } from '@/lib/useListPageState';

import { projectColumns, projectsPageIcon } from './shared';

export function ProjectsListPage() {
  const { projects } = useDemoData();

  const list = useListPageState({
    rows: projects,
    defaultSort: 'name',
    pageSize: 10,
    filterKeys: ['status'],
    filterFn: (project, { search, filters }) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        project.name.toLowerCase().includes(q) ||
        project.clientName.toLowerCase().includes(q) ||
        project.manager.toLowerCase().includes(q);
      const matchesStatus = filters.status.length === 0 || project.status === filters.status;
      return matchesSearch && matchesStatus;
    },
  });

  return (
    <CrudMainView
      title="Projects"
      subtitle="Delivery workspaces with tasks, documents, and milestones."
      icon={projectsPageIcon()}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search project, client, manager…"
      filters={[
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'Planning', label: 'Planning' },
            { value: 'Active', label: 'Active' },
            { value: 'On hold', label: 'On hold' },
            { value: 'Completed', label: 'Completed' },
          ],
        },
      ]}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      rows={list.paged}
      columns={projectColumns}
      allRows={list.filtered}
      exportOptions={{ fileName: 'projects', label: 'Export' }}
      emptyTitle="No projects found"
      entityLabel="project"
      getRowHref={(p) => `/projects/${p.id}`}
      sort={list.sort}
      onSortChange={list.onSortChange}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
    />
  );
}
