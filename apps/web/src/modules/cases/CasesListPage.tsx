import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { useListPageState } from '@/lib/useListPageState';

import { caseColumns, casesPageIcon, CasesHeaderActions } from './shared';

export function CasesListPage() {
  const { cases } = useDemoData();

  const list = useListPageState({
    rows: cases,
    defaultSort: '-openedAt',
    pageSize: 10,
    filterKeys: ['stage', 'priority', 'type'],
    filterFn: (caseRecord, { search, filters }) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        caseRecord.caseNumber.toLowerCase().includes(q) ||
        caseRecord.title.toLowerCase().includes(q) ||
        caseRecord.clientName.toLowerCase().includes(q) ||
        caseRecord.assignee.toLowerCase().includes(q);
      const matchesStage = filters.stage.length === 0 || caseRecord.stage === filters.stage;
      const matchesPriority =
        filters.priority.length === 0 || caseRecord.priority === filters.priority;
      const matchesType = filters.type.length === 0 || caseRecord.type === filters.type;
      return matchesSearch && matchesStage && matchesPriority && matchesType;
    },
  });

  return (
    <CrudMainView
      title="Case management"
      subtitle="Track support, legal, billing, and onboarding cases through a defined workflow."
      icon={casesPageIcon()}
      headerActions={<CasesHeaderActions />}
      search={list.search}
      onSearchChange={list.onSearchChange}
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
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      rows={list.paged}
      columns={caseColumns}
      allRows={list.filtered}
      exportOptions={{ fileName: 'cases', label: 'Export' }}
      emptyTitle="No cases found"
      entityLabel="case"
      getRowHref={(c) => `/cases/${c.id}`}
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
