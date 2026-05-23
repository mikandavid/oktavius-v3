import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Badge, ListRow, SectionCard } from '@oktavius/base-ui';

import { useDemoData, type CaseRecord } from '@/app/demo-data';
import { ModulePage } from '@/components/common/PageLayout';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { BackIcon } from '@/lib/icons';

import { CASE_STAGES, CASE_STATUS_MAP, casesPageIcon, PRIORITY_VARIANT } from './shared';

function CaseBoardCard({ caseRecord }: { caseRecord: CaseRecord }) {
  const navigate = useNavigate();

  return (
    <ListRow
      title={caseRecord.caseNumber}
      subtitle={
        <>
          <span className="line-clamp-2">{caseRecord.title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{caseRecord.clientName}</span>
        </>
      }
      trailing={
        <div className="flex flex-col items-end gap-1">
          <Badge variant={PRIORITY_VARIANT[caseRecord.priority]}>{caseRecord.priority}</Badge>
          {caseRecord.slaStatus === 'breach' ? (
            <Badge variant="destructive">SLA</Badge>
          ) : null}
        </div>
      }
      variant="queue"
      onClick={() => navigate(`/cases/${caseRecord.id}`)}
    />
  );
}

export function CasesBoardPage() {
  const { cases } = useDemoData();

  const byStage = useMemo(() => {
    const map = new Map<string, CaseRecord[]>();
    for (const stage of CASE_STAGES) {
      map.set(stage, cases.filter((c) => c.stage === stage));
    }
    return map;
  }, [cases]);

  return (
    <ModulePage
      title="Case board"
      subtitle="Pipeline view by workflow stage — click a card to open the case workspace."
      icon={casesPageIcon()}
      backTo="/cases"
      actions={
        <Link to="/cases" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <BackIcon size={14} />
          List view
        </Link>
      }
    >
      <div className="grid gap-4 xl:grid-cols-4">
        {CASE_STAGES.map((stage) => {
          const items = byStage.get(stage) ?? [];
          return (
            <SectionCard
              key={stage}
              title={stage}
              meta={`${items.length} cases`}
              className="min-h-[320px]"
            >
              <div className="space-y-2">
                {items.length ? (
                  items.map((caseRecord) => <CaseBoardCard key={caseRecord.id} caseRecord={caseRecord} />)
                ) : (
                  <p className="py-8 text-center text-xs text-muted-foreground">No cases in this stage.</p>
                )}
              </div>
            </SectionCard>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Stage indicators:</span>
        {CASE_STAGES.map((stage) => (
          <StatusBadge key={stage} status={stage} variantMap={CASE_STATUS_MAP} />
        ))}
      </div>
    </ModulePage>
  );
}
