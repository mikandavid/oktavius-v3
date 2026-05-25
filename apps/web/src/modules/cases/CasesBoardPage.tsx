import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Badge,
  KanbanBoard,
  ListRow,
  formatDisplayDate,
  type KanbanColumn,
} from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { PageHeaderCtaLink } from '@/components/common/PageHeaderButtons';
import type { CaseRecord } from '@/app/demo-data';
import { useDemoData } from '@/app/demo-data';
import { PlusIcon } from '@/lib/icons';
import { toast } from '@/lib/toast';

import { CASE_STAGES, casePriorityBadge, casesPageIcon } from './shared';

export function CasesBoardPage() {
  const navigate = useNavigate();
  const { cases, updateCaseStage } = useDemoData();

  const columns = useMemo<KanbanColumn<CaseRecord>[]>(
    () =>
      CASE_STAGES.map((stage) => ({
        id: stage,
        title: stage,
        items: cases.filter((entry) => entry.stage === stage),
      })),
    [cases],
  );

  return (
    <ModulePage
      title="Case board"
      subtitle="Pipeline view by stage"
      icon={casesPageIcon()}
      backTo="/cases"
      actions={
        <PageHeaderCtaLink to="/cases/new">
          <PlusIcon size={14} />
          New case
        </PageHeaderCtaLink>
      }
    >
      <KanbanBoard
        columns={columns}
        getItemId={(item) => item.id}
        emptyLabel="No cases in this stage"
        onCardClick={(item) => navigate(`/cases/${item.id}`)}
        onMove={({ itemId, toColumnId }) => {
          updateCaseStage(itemId, toColumnId as CaseRecord['stage']);
          toast.success(`Moved to ${toColumnId}.`);
        }}
        renderCard={(item) => (
          <ListRow
            title={item.title}
            subtitle={item.clientName}
            meta={formatDisplayDate(item.dueAt)}
            trailing={
              <span className="flex flex-wrap items-center justify-end gap-1">
                {casePriorityBadge(item.priority)}
                <Badge variant="outline">{item.type}</Badge>
              </span>
            }
          />
        )}
      />
    </ModulePage>
  );
}
