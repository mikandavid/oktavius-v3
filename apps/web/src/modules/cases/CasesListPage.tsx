import { useMemo, useState } from 'react';

import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { sortRows } from '@/lib/sortRows';

import { caseColumns, casesPageIcon, CasesHeaderActions } from './shared';

export function CasesListPage() {
  const { cases } = useDemoData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({ stage: '', priority: '', type: '' });
  const [sort, setSort] = useState('-openedAt');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = cases.filter((c) => {
      const matchesSearch =
        !q ||
        c.caseNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q) ||
        c.assignee.toLowerCase().includes(q);
      const matchesStage = !filters.stage || c.stage === filters.stage;
      const matchesPriority = !filters.priority || c.priority === filters.priority;
      const matchesType = !filters.type || c.type === filters.type;
      return matchesSearch && matchesStage && matchesPriority && matchesType;
    });
    return sortRows(rows, sort);
  }, [cases, search, filters, sort]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <CrudMainView
      title="Case management"
      subtitle="Track support, legal, billing, and onboarding cases through a defined workflow."
      icon={casesPageIcon()}
      headerActions={<CasesHeaderActions />}
      search={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(1);
      }}
      searchPlaceholder="Search case, client, owner…"
      filters={[
        {
          key: 'stage',
          label: 'Stage',
          options: [
            { value: 'Intake', label: 'Intake' },
            { value: 'Investigation', label: 'Investigation' },
            { value: 'Resolution', label: 'Resolution' },
            { value: 'Closed', label: 'Closed' },
          ],
        },
        {
          key: 'priority',
          label: 'Priority',
          options: [
            { value: 'Low', label: 'Low' },
            { value: 'Normal', label: 'Normal' },
            { value: 'High', label: 'High' },
            { value: 'Critical', label: 'Critical' },
          ],
        },
        {
          key: 'type',
          label: 'Type',
          options: [
            { value: 'Support', label: 'Support' },
            { value: 'Legal', label: 'Legal' },
            { value: 'Billing', label: 'Billing' },
            { value: 'Onboarding', label: 'Onboarding' },
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
        setFilters({ stage: '', priority: '', type: '' });
        setPage(1);
      }}
      rows={paged}
      columns={caseColumns}
      allRows={filtered}
      exportOptions={{ fileName: 'cases', label: 'Export' }}
      emptyTitle="No cases found"
      entityLabel="case"
      getRowHref={(c) => `/cases/${c.id}`}
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
