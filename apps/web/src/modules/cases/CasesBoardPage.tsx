import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Badge,
  KanbanBoard,
  ListRow,
  formatDisplayDate,
  type KanbanColumn,
} from '@oktavius/base-ui';

import { useApiRegistry } from '@/api/ApiProvider';
import { ModulePage } from '@/components/common/PageLayout';
import { PageHeaderCtaLink } from '@/components/common/PageHeaderButtons';
import type { CaseRecord } from '@/app/demo-data';
import { useDemoData } from '@/app/demo-data';
import { PlusIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import { casePriorityBadge, casesPageIcon } from './shared';
import { useCasesModuleConfig } from './useCasesModuleConfig';

export function CasesBoardPage() {
  const navigate = useNavigate();
  const api = useApiRegistry();
  const { cases } = useDemoData();
  const moduleConfig = useCasesModuleConfig();

  const columns = useMemo<KanbanColumn<CaseRecord>[]>(
    () =>
      moduleConfig.caseStages.map((stage) => ({
        id: stage,
        title: stage,
        items: cases.filter((entry) => entry.stage === stage),
      })),
    [cases, moduleConfig.caseStages],
  );

  return (
    <ModulePage
      title={moduleConfig.isFuneral ? 'Sterbefall-Pipeline' : 'Case board'}
      subtitle={moduleConfig.isFuneral ? 'Nach Bearbeitungsstatus' : 'Pipeline view by stage'}
      icon={casesPageIcon()}
      backTo={moduleConfig.basePath}
      actions={
        <PageHeaderCtaLink to={`${moduleConfig.basePath}/new`}>
          <PlusIcon size={14} />
          New case
        </PageHeaderCtaLink>
      }
    >
      <KanbanBoard
        columns={columns}
        getItemId={(item) => item.id}
        emptyLabel="No cases in this stage"
        onCardClick={(item) => navigate(`${moduleConfig.basePath}/${item.id}`)}
        onMove={({ itemId, toColumnId }) => {
          void api.cases
            .updateStage(itemId, toColumnId as CaseRecord['stage'])
            .then(() => {
              appToast.success(`Moved to ${toColumnId}.`);
            })
            .catch((error) => {
              appToast.fromApiError(error, 'Case could not be moved.');
            });
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
