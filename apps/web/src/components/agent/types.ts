export type AgentMessageRole = 'user' | 'assistant' | 'tool' | 'confirmation' | 'card' | 'system';

export type AgentConfirmationStatus = 'pending' | 'approved' | 'rejected';

export type AgentPythonStatus = 'running' | 'done' | 'error';

export type AgentSkillApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AgentConfirmationPayload {
  id: string;
  action: string;
  description: string;
  details?: Record<string, unknown>;
  status: AgentConfirmationStatus;
}

export type AgentEntityListItem = {
  id: string;
  label: string;
  subtitle?: string;
  status?: string;
  href?: string;
};

export type AgentEntityListCardPayload = {
  kind: 'entity-list';
  title?: string;
  total?: number;
  items: AgentEntityListItem[];
};

export type AgentEntityDetailCardPayload = {
  kind: 'entity-detail';
  title: string;
  subtitle?: string;
  status?: string;
  fields: Array<{ label: string; value: string }>;
  href?: string;
};

export type AgentPythonExecutionCardPayload = {
  kind: 'python';
  summary: string;
  code?: string;
  status: AgentPythonStatus;
  output?: string;
  error?: string;
};

export type AgentGeneratedDocumentCardPayload = {
  kind: 'document';
  title: string;
  status: 'generating' | 'completed' | 'failed';
  generationId: string;
  formats?: Array<'pdf' | 'docx'>;
};

export type AgentScheduleEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  type?: string;
};

export type AgentScheduleCardPayload = {
  kind: 'schedule';
  title?: string;
  subtitle?: string;
  events: AgentScheduleEvent[];
};

export type AgentSkillApprovalField = {
  label: string;
  value: string;
  confidence?: number;
  status?: 'ok' | 'warning' | 'error';
};

export type AgentSkillApprovalCardPayload = {
  kind: 'skill-approval';
  id: string;
  title: string;
  summary: string;
  skillKey?: string;
  fields?: AgentSkillApprovalField[];
  status: AgentSkillApprovalStatus;
};

export type AgentFinancialMetric = {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'flat';
};

export type AgentFinancialCardPayload = {
  kind: 'financial';
  title?: string;
  metrics?: AgentFinancialMetric[];
};

export type AgentSearchResultItem = {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  subtitle?: string;
  href?: string;
  route?: string;
  type?: string;
};

export type AgentSearchResultGroup = {
  type?: string;
  category?: string;
  items?: AgentSearchResultItem[];
};

export type AgentSearchResultsCardPayload = {
  kind: 'search-results';
  query?: string;
  totalCount?: number;
  groups?: AgentSearchResultGroup[];
  items?: AgentSearchResultItem[];
};

export type AgentTimelineEvent = {
  date?: string;
  timestamp?: string;
  title?: string;
  description?: string;
  type?: string;
};

export type AgentTimelineCardPayload = {
  kind: 'timeline';
  title?: string;
  events: AgentTimelineEvent[];
};

export type AgentActionItem = {
  id?: string;
  title?: string;
  label?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
};

export type AgentActionItemsCardPayload = {
  kind: 'action-items';
  title?: string;
  items: AgentActionItem[];
};

export type AgentActiveTimerCardPayload = {
  kind: 'active-timer';
  title?: string;
  project?: string;
  client?: string;
  elapsedSeconds?: number;
  startedAt?: string;
  isRunning?: boolean;
};

export type AgentPlannerSlot = {
  id?: string;
  label?: string;
  staff?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
};

export type AgentPlannerCardPayload = {
  kind: 'planner';
  title?: string;
  date?: string;
  slots: AgentPlannerSlot[];
};

export type AgentMemoryEntry = {
  id?: string;
  title?: string;
  summary?: string;
  createdAt?: string;
  score?: number;
};

export type AgentMemoryCardPayload = {
  kind: 'memory';
  title?: string;
  query?: string;
  entries: AgentMemoryEntry[];
};

export type AgentProjectSummaryCardPayload = {
  kind: 'project-summary';
  title: string;
  subtitle?: string;
  status?: string;
  metrics?: Array<{ label: string; value: string }>;
  highlights?: string[];
};

export type AgentCatalogItemCardPayload = {
  kind: 'catalog-item';
  title: string;
  sku?: string;
  price?: string;
  status?: string;
  fields?: Array<{ label: string; value: string }>;
};

export type AgentDocProcessingCardPayload = {
  kind: 'doc-processing';
  variant: 'progress' | 'result';
  title?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  documentName?: string;
  fields?: Array<{ label: string; value: string }>;
};

export type AgentEmailComposeCardPayload = {
  kind: 'email-compose';
  to?: string;
  subject?: string;
  body?: string;
  status?: 'draft' | 'ready' | 'sent';
};

export type AgentContextDumpCardPayload = {
  kind: 'context-dump';
  title?: string;
  sections: Array<{ label: string; content: string }>;
};

export type AgentSalesDocumentCardPayload = {
  kind: 'sales-document';
  title: string;
  documentNumber?: string;
  status?: string;
  total?: string;
  dueDate?: string;
  fields?: Array<{ label: string; value: string }>;
  href?: string;
};

export type AgentCardPayload =
  | AgentEntityListCardPayload
  | AgentEntityDetailCardPayload
  | AgentPythonExecutionCardPayload
  | AgentGeneratedDocumentCardPayload
  | AgentScheduleCardPayload
  | AgentSkillApprovalCardPayload
  | AgentFinancialCardPayload
  | AgentSearchResultsCardPayload
  | AgentTimelineCardPayload
  | AgentActionItemsCardPayload
  | AgentActiveTimerCardPayload
  | AgentPlannerCardPayload
  | AgentMemoryCardPayload
  | AgentProjectSummaryCardPayload
  | AgentCatalogItemCardPayload
  | AgentDocProcessingCardPayload
  | AgentEmailComposeCardPayload
  | AgentContextDumpCardPayload
  | AgentSalesDocumentCardPayload;

export type AgentUIMessagePayload = {
  component: string;
  props: Record<string, unknown>;
};

export interface AgentMessage {
  id: string;
  role: AgentMessageRole;
  content?: string;
  createdAt: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: string;
  confirmation?: AgentConfirmationPayload;
  card?: AgentCardPayload;
  ui?: AgentUIMessagePayload;
}

export interface AgentTokenStats {
  inputTokens: number;
  outputTokens: number;
  contextWindowTokens: number;
}

export type AgentModelMode = 'default' | 'thinking' | 'fast';

export type AgentRuntimeMode = 'cloud' | 'desktop';

export const DEFAULT_AGENT_TOKEN_STATS: AgentTokenStats = {
  inputTokens: 0,
  outputTokens: 0,
  contextWindowTokens: 200_000,
};
