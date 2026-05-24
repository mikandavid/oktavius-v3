import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Badge, KanbanBoard, ListRow } from '@oktavius/base-ui';

import { useDemoData, type CaseRecord } from '@/app/demo-data';
import { ModulePage } from '@/components/common/PageLayout';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { BackIcon } from '@/lib/icons';

import { CASE_PRIORITY_MAP, CASE_STAGES, casesPageIcon } from './shared';

function CaseBoardCard({ caseRecord }: { caseRecord: CaseRecord }) {
  return (
    <ListRow
      title={caseRecord.caseNumber}
      subtitle={
        <>
          <span className="line-clamp-2">{caseRecord.title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {caseRecord.clientName}
          </span>
        </>
      }
      trailing={
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={caseRecord.priority} variantMap={CASE_PRIORITY_MAP} />
          {caseRecord.slaStatus === 'breach' ? <Badge variant="destructive">SLA</Badge> : null}
        </div>
      }
      variant="queue"
    />
  );
}

export function CasesBoardPage() {
  const { cases } = useDemoData();
  const navigate = useNavigate();

  const columns = useMemo(
    () =>
      CASE_STAGES.map((stage) => ({
        id: stage,
        title: stage,
        items: cases.filter((caseRecord) => caseRecord.stage === stage),
        meta: `${cases.filter((caseRecord) => caseRecord.stage === stage).length} cases`,
      })),
    [cases],
  );

  return (
    <ModulePage
      title="Case board"
      subtitle="Pipeline view by workflow stage — click a card to open the case workspace."
      icon={casesPageIcon()}
      backTo="/cases"
      actions={
        <Link
          to="/cases"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <BackIcon size={14} />
          List view
        </Link>
      }
    >
      <KanbanBoard
        columns={columns}
        getItemId={(caseRecord) => caseRecord.id}
        renderCard={(caseRecord) => <CaseBoardCard caseRecord={caseRecord} />}
        onCardClick={(caseRecord) => navigate(`/cases/${caseRecord.id}`)}
        emptyLabel="No cases in this stage"
      />
    </ModulePage>
  );
}
