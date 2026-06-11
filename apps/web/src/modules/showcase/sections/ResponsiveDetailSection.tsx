import { ListRow, RecordVisual, ScrollArea } from '@oktavius/base-ui';

import { QUEUE_ITEM_SELECTED_CLASS, SplitViewQueue } from '@/components/common/SplitViewQueue';
import { ResponsiveDetailLayout } from '@/components/detail/ResponsiveDetailLayout';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { CaseIcon } from '@/lib/icons';

import { ShowcaseBlock } from '../shared';

const RESPONSIVE_ITEMS = [
  { id: 'case_100', title: 'CASE-100', subtitle: 'Contract review', owner: 'Maria Keller' },
  { id: 'case_101', title: 'CASE-101', subtitle: 'Invoice dispute', owner: 'Noah Bauer' },
  { id: 'case_102', title: 'CASE-102', subtitle: 'Renewal workflow', owner: 'Lea Gruber' },
];

export function ResponsiveDetailSection() {
  return (
    <div className="space-y-4">
      <ShowcaseBlock
        title="ResponsiveDetailLayout"
        meta="Desktop split · mobile stack · selection stored in ?id="
      >
        <ResponsiveDetailLayout
          paramKey="id"
          defaultSelectedId="case_100"
          persistKey="showcase-responsive-detail"
          backLabel="Back to queue"
          master={({ selectedId, select }) => (
            <ScrollArea className="h-full max-h-[360px]">
              <SplitViewQueue>
                {RESPONSIVE_ITEMS.map((item) => (
                  <ListRow
                    key={item.id}
                    variant="queue"
                    title={item.title}
                    subtitle={`${item.subtitle} · ${item.owner}`}
                    onClick={() => select(item.id)}
                    className={item.id === selectedId ? QUEUE_ITEM_SELECTED_CLASS : undefined}
                    aria-current={item.id === selectedId ? 'true' : undefined}
                  />
                ))}
              </SplitViewQueue>
            </ScrollArea>
          )}
          detail={({ selectedId }) => {
            const item =
              RESPONSIVE_ITEMS.find((candidate) => candidate.id === selectedId) ??
              RESPONSIVE_ITEMS[0];
            return (
              <div className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <RecordVisual
                    kind="icon"
                    icon={<CaseIcon size={16} weight="duotone" />}
                    size="md"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge status="Active" variantMap={{ Active: 'success' }} />
                      <StatusBadge status={item.owner} variantMap={{ [item.owner]: 'info' }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </ShowcaseBlock>
    </div>
  );
}
