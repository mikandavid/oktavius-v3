import type { AgentCardPayload } from '../types';
import { AgentActionItemsCard } from './AgentActionItemsCard';
import { AgentActiveTimerCard } from './AgentActiveTimerCard';
import { AgentCatalogItemCard } from './AgentCatalogItemCard';
import { AgentContextDumpCard } from './AgentContextDumpCard';
import { AgentDocProcessingCard } from './AgentDocProcessingCard';
import { AgentEmailComposeCard } from './AgentEmailComposeCard';
import { AgentEntityDetailCard } from './AgentEntityDetailCard';
import { AgentEntityListCard } from './AgentEntityListCard';
import { AgentFinancialCard } from './AgentFinancialCard';
import { AgentGeneratedDocumentCard } from './AgentGeneratedDocumentCard';
import { AgentMemoryCard } from './AgentMemoryCard';
import { AgentPlannerCard } from './AgentPlannerCard';
import { AgentProjectSummaryCard } from './AgentProjectSummaryCard';
import { AgentPythonExecutionCard } from './AgentPythonExecutionCard';
import { AgentSalesDocumentCard } from './AgentSalesDocumentCard';
import { AgentScheduleCard } from './AgentScheduleCard';
import { AgentSearchResultsCard } from './AgentSearchResultsCard';
import { AgentSkillApprovalCard } from './AgentSkillApprovalCard';
import { AgentTimelineCard } from './AgentTimelineCard';

type RenderAgentCardOptions = {
  onEntityClick?: (itemId: string, href?: string) => void;
  onEntityOpen?: (href?: string) => void;
  onDocumentDownload?: (format: 'pdf' | 'docx') => void;
  onDocumentOpen?: () => void;
  onSkillApprovalRespond?: (approved: boolean) => void | Promise<void>;
  onTimerStop?: () => void;
  onEmailSend?: () => void;
};

export function renderAgentCard(card: AgentCardPayload, options: RenderAgentCardOptions = {}) {
  switch (card.kind) {
    case 'entity-list':
      return <AgentEntityListCard {...card} onItemClick={options.onEntityClick} />;
    case 'entity-detail':
      return <AgentEntityDetailCard {...card} onOpen={options.onEntityOpen} />;
    case 'python':
      return <AgentPythonExecutionCard {...card} />;
    case 'document':
      return (
        <AgentGeneratedDocumentCard
          {...card}
          onDownload={options.onDocumentDownload}
          onOpen={options.onDocumentOpen}
        />
      );
    case 'schedule':
      return <AgentScheduleCard {...card} />;
    case 'skill-approval':
      return <AgentSkillApprovalCard {...card} onRespond={options.onSkillApprovalRespond} />;
    case 'financial':
      return <AgentFinancialCard {...card} />;
    case 'search-results':
      return <AgentSearchResultsCard {...card} />;
    case 'timeline':
      return <AgentTimelineCard {...card} />;
    case 'action-items':
      return <AgentActionItemsCard {...card} />;
    case 'active-timer':
      return <AgentActiveTimerCard {...card} onStop={options.onTimerStop} />;
    case 'planner':
      return <AgentPlannerCard {...card} />;
    case 'memory':
      return <AgentMemoryCard {...card} />;
    case 'project-summary':
      return <AgentProjectSummaryCard {...card} />;
    case 'catalog-item':
      return <AgentCatalogItemCard {...card} />;
    case 'doc-processing':
      return <AgentDocProcessingCard {...card} />;
    case 'email-compose':
      return <AgentEmailComposeCard {...card} onSend={options.onEmailSend} />;
    case 'context-dump':
      return <AgentContextDumpCard {...card} />;
    case 'sales-document':
      return <AgentSalesDocumentCard {...card} onOpen={options.onEntityOpen} />;
    default:
      return null;
  }
}
