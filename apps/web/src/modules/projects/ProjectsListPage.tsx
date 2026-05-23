import { useMemo, useState } from 'react';

import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { sortRows } from '@/lib/sortRows';

import { projectColumns, projectsPageIcon } from './shared';

export function ProjectsListPage() {
  const { projects } = useDemoData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({ status: '' });
  const [sort, setSort] = useState('name');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = projects.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.manager.toLowerCase().includes(q);
      const matchesStatus = !filters.status || p.status === filters.status;
      return matchesSearch && matchesStatus;
    });
    return sortRows(rows, sort);
  }, [projects, search, filters, sort]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <CrudMainView
      title="Projects"
      subtitle="Delivery workspaces with tasks, documents, and milestones."
      icon={projectsPageIcon()}
      search={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(1);
      }}
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
      values={filters}
      onFilterChange={(key, value) => {
        setFilters((f) => ({ ...f, [key]: value }));
        setPage(1);
      }}
      onReset={() => {
        setSearch('');
        setFilters({ status: '' });
        setPage(1);
      }}
      rows={paged}
      columns={projectColumns}
      allRows={filtered}
      exportOptions={{ fileName: 'projects', label: 'Export' }}
      emptyTitle="No projects found"
      entityLabel="project"
      getRowHref={(p) => `/projects/${p.id}`}
      sort={sort}
      onSortChange={(s) => {
        setSort(s);
        setPage(1);
      }}
      page={safePage}
      pageSize={pageSize}
      total={filtered.length}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  );
}
