import { Button } from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import {
  DEMO_ACTION_ITEMS_CARD,
  DEMO_ACTIVE_TIMER_CARD,
  DEMO_CATALOG_ITEM_CARD,
  DEMO_CONTEXT_DUMP_CARD,
  DEMO_DOC_PROCESSING_CARD,
  DEMO_DOC_PROCESSING_PROGRESS_CARD,
  DEMO_DOCUMENT_CARD,
  DEMO_EMAIL_COMPOSE_CARD,
  DEMO_ENTITY_DETAIL_CARD,
  DEMO_ENTITY_LIST_CARD,
  DEMO_FINANCIAL_CARD,
  DEMO_MEMORY_CARD,
  DEMO_PLANNER_CARD,
  DEMO_PROJECT_SUMMARY_CARD,
  DEMO_PYTHON_CARD,
  DEMO_SALES_DOCUMENT_CARD,
  DEMO_SCHEDULE_CARD,
  DEMO_SEARCH_RESULTS_CARD,
  DEMO_SKILL_APPROVAL_CARD,
  DEMO_TIMELINE_CARD,
} from '@/components/agent/agentDemoCardPayloads';
import { AgentFileAttachmentChip } from '@/components/agent/AgentFileAttachmentChip';
import { AgentMessageList } from '@/components/agent/AgentMessageList';
import { AgentSettingsPopover } from '@/components/agent/AgentSettingsPopover';
import { AgentThinkingIndicator } from '@/components/agent/AgentThinkingIndicator';
import { AgentWelcomeScreen } from '@/components/agent/AgentWelcomeScreen';
import {
  AgentActionItemsCard,
  AgentActiveTimerCard,
  AgentCatalogItemCard,
  AgentContextDumpCard,
  AgentDocProcessingCard,
  AgentEmailComposeCard,
  AgentEntityDetailCard,
  AgentEntityListCard,
  AgentFinancialCard,
  AgentGeneratedDocumentCard,
  AgentMemoryCard,
  AgentPlannerCard,
  AgentProjectSummaryCard,
  AgentPythonExecutionCard,
  AgentSalesDocumentCard,
  AgentScheduleCard,
  AgentSearchResultsCard,
  AgentSkillApprovalCard,
  AgentTimelineCard,
} from '@/components/agent/cards';
import { ChatFilePreviewDialog } from '@/components/agent/ChatFilePreviewDialog';
import { ContentPanel } from '@/components/agent/ContentPanel';
import { ContextUsageIndicator, TokenBadge } from '@/components/agent/ContextUsageIndicator';
import { EditableConversationTitle } from '@/components/agent/EditableConversationTitle';
import { StructuredContent } from '@/components/agent/structured/StructuredContent';
import type {
  AgentActionItemsCardPayload,
  AgentActiveTimerCardPayload,
  AgentCatalogItemCardPayload,
  AgentContextDumpCardPayload,
  AgentDocProcessingCardPayload,
  AgentEmailComposeCardPayload,
  AgentEntityDetailCardPayload,
  AgentEntityListCardPayload,
  AgentFinancialCardPayload,
  AgentGeneratedDocumentCardPayload,
  AgentMemoryCardPayload,
  AgentMessage,
  AgentModelMode,
  AgentPlannerCardPayload,
  AgentProjectSummaryCardPayload,
  AgentPythonExecutionCardPayload,
  AgentRuntimeMode,
  AgentSalesDocumentCardPayload,
  AgentScheduleCardPayload,
  AgentSearchResultsCardPayload,
  AgentSkillApprovalCardPayload,
  AgentTimelineCardPayload,
  AgentTokenStats,
} from '@/components/agent/types';
import { ChatUIComponent } from '@/components/agent/UIComponentRegistry';
import { RecordingBar, VoiceRecorder } from '@/components/agent/VoiceRecorder';
import { MobileAgentLayout } from '@/components/layout/MobileAgentLayout';
import { appToast } from '@/lib/toast';

import { ShowcaseBlock } from '../shared';

const BASE_TOKEN_STATS: AgentTokenStats = {
  inputTokens: 18_400,
  outputTokens: 2_150,
  contextWindowTokens: 200_000,
};

const INITIAL_MESSAGES: AgentMessage[] = [
  {
    id: 'u1',
    role: 'user',
    content: 'Find open tasks for Apex Technologies and summarize next steps.',
    createdAt: '2024-12-05T09:12:00Z',
  },
  {
    id: 'a1',
    role: 'assistant',
    content: 'I found 3 open tasks linked to Apex Technologies. See the result cards below.',
    createdAt: '2024-12-05T09:12:04Z',
  },
  {
    id: 'card_list',
    role: 'card',
    createdAt: '2024-12-05T09:12:05Z',
    card: DEMO_ENTITY_LIST_CARD,
  },
  {
    id: 'card_detail',
    role: 'card',
    createdAt: '2024-12-05T09:12:06Z',
    card: DEMO_ENTITY_DETAIL_CARD,
  },
  {
    id: 't1',
    role: 'tool',
    createdAt: '2024-12-05T09:12:07Z',
    toolName: 'list_open_tasks',
    toolInput: { clientId: 'c1', status: 'open' },
    toolResult: JSON.stringify(
      [
        { id: 'task_1', title: 'Send renewal proposal', dueAt: '2024-12-15' },
        { id: 'task_2', title: 'UAT sign-off', dueAt: '2025-01-10' },
      ],
      null,
      2,
    ),
  },
  {
    id: 'card_python',
    role: 'card',
    createdAt: '2024-12-05T09:12:08Z',
    card: DEMO_PYTHON_CARD,
  },
  {
    id: 'card_doc',
    role: 'card',
    createdAt: '2024-12-05T09:12:09Z',
    card: DEMO_DOCUMENT_CARD,
  },
  {
    id: 'card_schedule',
    role: 'card',
    createdAt: '2024-12-05T09:12:10Z',
    card: DEMO_SCHEDULE_CARD,
  },
  {
    id: 'card_skill',
    role: 'card',
    createdAt: '2024-12-05T09:12:11Z',
    card: DEMO_SKILL_APPROVAL_CARD,
  },
  {
    id: 'c1',
    role: 'confirmation',
    createdAt: '2024-12-05T09:12:12Z',
    confirmation: {
      id: 'confirm_demo',
      action: 'Delete draft invoice',
      description: 'Remove INV-2024-0192 before it is sent to the client.',
      details: { Invoice: 'INV-2024-0192', Client: 'Apex Technologies' },
      status: 'pending',
    },
  },
];

export function AgentSection() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [tokenStats, setTokenStats] = useState(BASE_TOKEN_STATS);
  const [modelMode, setModelMode] = useState<AgentModelMode>('thinking');
  const [runtimeMode, setRuntimeMode] = useState<AgentRuntimeMode>('cloud');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [contentPanelOpen, setContentPanelOpen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [conversationTitle, setConversationTitle] = useState('Apex renewal follow-up');

  const pendingConfirmations = useMemo(
    () => messages.filter((message) => message.confirmation?.status === 'pending').length,
    [messages],
  );

  const handleConfirmationRespond = (messageId: string, approved: boolean) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId && message.confirmation
          ? {
              ...message,
              confirmation: {
                ...message.confirmation,
                status: approved ? 'approved' : 'rejected',
              },
            }
          : message,
      ),
    );
    setTokenStats((current) => ({
      ...current,
      outputTokens: current.outputTokens + 120,
    }));
    appToast.success(approved ? 'Action approved.' : 'Action rejected.');
  };

  const handleSkillApprovalRespond = (messageId: string, approved: boolean) => {
    setMessages((current) =>
      current.map((message) => {
        if (message.id !== messageId || message.card?.kind !== 'skill-approval') {
          return message;
        }
        return {
          ...message,
          card: {
            ...message.card,
            status: approved ? 'approved' : 'rejected',
          },
        };
      }),
    );
    appToast.success(approved ? 'Skill approved.' : 'Skill rejected.');
  };

  const resetThread = () => {
    setMessages(INITIAL_MESSAGES);
    setTokenStats(BASE_TOKEN_STATS);
  };

  return (
    <div className="space-y-4">
      <ShowcaseBlock
        title="ContextUsageIndicator"
        meta="Context window usage · chat header companion"
        actions={<TokenBadge stats={tokenStats} />}
      >
        <ContextUsageIndicator tokens={tokenStats.inputTokens + tokenStats.outputTokens} />
      </ShowcaseBlock>

      <ShowcaseBlock
        title="AgentSettingsPopover"
        meta="Model mode · runtime · connection status"
        actions={
          <AgentSettingsPopover
            modelMode={modelMode}
            onModelModeChange={setModelMode}
            runtimeMode={runtimeMode}
            onRuntimeModeChange={setRuntimeMode}
          />
        }
      >
        <p className="text-sm text-muted-foreground">
          Model: <span className="font-medium text-foreground">{modelMode}</span> · Runtime:{' '}
          <span className="font-medium text-foreground">{runtimeMode}</span>
        </p>
      </ShowcaseBlock>

      <ShowcaseBlock title="AgentWelcomeScreen" meta="Empty thread hero">
        <div className="rounded-card border border-border/60 bg-card">
          <AgentWelcomeScreen
            latestConversationTitle="Apex renewal follow-up"
            latestConversationTime="05.12.2024, 09:12"
            onOpenLatestConversation={() => {
              appToast.info('Open latest conversation.');
            }}
            onStartNew={() => {
              appToast.info('Start new chat.');
            }}
          />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="AgentThinkingIndicator" meta="Inline loading state">
        <AgentThinkingIndicator />
      </ShowcaseBlock>

      <ShowcaseBlock title="AgentFileAttachmentChip" meta="Composer attachment chips">
        <div className="flex flex-wrap gap-2">
          <AgentFileAttachmentChip fileName="proposal.pdf" onRemove={() => undefined} />
          <AgentFileAttachmentChip fileName="notes.txt" onRemove={() => undefined} />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="StructuredContent" meta="Assistant text with oct-* inline blocks">
        <div className="rounded-card border border-border/60 bg-background p-4 text-sm">
          <StructuredContent
            text={`Here is the receivables snapshot:

<oct-stat label="Open invoices" value="€ 128.400" trend="up" change="+8% vs last month" />

<oct-data-card title="Top client" subtitle="Apex Technologies">
{"fields":[{"label":"Status","value":"Active","type":"badge"},{"label":"Owner","value":"Sales team"}]}
</oct-data-card>`}
          />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Result cards"
        meta="Entity · financial · search · timeline · timer · sales · docs"
      >
        <div className="space-y-3">
          <AgentEntityListCard
            {...(DEMO_ENTITY_LIST_CARD as AgentEntityListCardPayload)}
            onItemClick={(id) => {
              appToast.info(`Open ${id}`);
            }}
          />
          <AgentEntityDetailCard
            {...(DEMO_ENTITY_DETAIL_CARD as AgentEntityDetailCardPayload)}
            onOpen={() => {
              appToast.info('Open record.');
            }}
          />
          <AgentPythonExecutionCard {...(DEMO_PYTHON_CARD as AgentPythonExecutionCardPayload)} />
          <AgentGeneratedDocumentCard
            {...(DEMO_DOCUMENT_CARD as AgentGeneratedDocumentCardPayload)}
            onDownload={(format) => {
              appToast.success(`Download ${format.toUpperCase()}`);
            }}
            onOpen={() => {
              appToast.info('Open in documents.');
            }}
          />
          <AgentScheduleCard {...(DEMO_SCHEDULE_CARD as AgentScheduleCardPayload)} />
          <AgentSkillApprovalCard
            {...(DEMO_SKILL_APPROVAL_CARD as AgentSkillApprovalCardPayload)}
            onRespond={async (approved) => {
              await new Promise((resolve) => window.setTimeout(resolve, 400));
              appToast.success(approved ? 'Skill approved.' : 'Skill rejected.');
            }}
          />
          <AgentFinancialCard {...(DEMO_FINANCIAL_CARD as AgentFinancialCardPayload)} />
          <AgentSearchResultsCard
            {...(DEMO_SEARCH_RESULTS_CARD as AgentSearchResultsCardPayload)}
          />
          <AgentTimelineCard {...(DEMO_TIMELINE_CARD as AgentTimelineCardPayload)} />
          <AgentActionItemsCard {...(DEMO_ACTION_ITEMS_CARD as AgentActionItemsCardPayload)} />
          <AgentActiveTimerCard {...(DEMO_ACTIVE_TIMER_CARD as AgentActiveTimerCardPayload)} />
          <AgentMemoryCard {...(DEMO_MEMORY_CARD as AgentMemoryCardPayload)} />
          <AgentSalesDocumentCard
            {...(DEMO_SALES_DOCUMENT_CARD as AgentSalesDocumentCardPayload)}
          />
          <AgentDocProcessingCard
            {...(DEMO_DOC_PROCESSING_CARD as AgentDocProcessingCardPayload)}
          />
          <AgentEmailComposeCard {...(DEMO_EMAIL_COMPOSE_CARD as AgentEmailComposeCardPayload)} />
          <AgentPlannerCard {...(DEMO_PLANNER_CARD as AgentPlannerCardPayload)} />
          <AgentProjectSummaryCard
            {...(DEMO_PROJECT_SUMMARY_CARD as AgentProjectSummaryCardPayload)}
          />
          <AgentCatalogItemCard {...(DEMO_CATALOG_ITEM_CARD as AgentCatalogItemCardPayload)} />
          <AgentContextDumpCard {...(DEMO_CONTEXT_DUMP_CARD as AgentContextDumpCardPayload)} />
          <AgentDocProcessingCard
            {...(DEMO_DOC_PROCESSING_PROGRESS_CARD as AgentDocProcessingCardPayload)}
          />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="ChatUIComponent" meta="Backend ui.component name → lazy registry card">
        <ChatUIComponent name="FinancialOverview" props={DEMO_FINANCIAL_CARD} />
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Chat shell utilities"
        meta="Title · voice · preview · panel · mobile layout"
      >
        <div className="space-y-4 rounded-card border border-border/60 bg-background p-4">
          <EditableConversationTitle
            conversationId="demo_chat"
            title={conversationTitle}
            fallbackTitle="Agent chat"
            onRename={async (_id, title) => {
              setConversationTitle(title);
              appToast.success('Conversation renamed.');
            }}
          />
          <div className="flex items-center gap-3">
            <VoiceRecorder
              isRecording={isVoiceRecording}
              onStart={() => setIsVoiceRecording(true)}
              onStop={() => setIsVoiceRecording(false)}
            />
            <RecordingBar isRecording={isVoiceRecording} transcript="Listening for voice input…" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setPreviewFile(
                  new File(['Demo PDF content'], 'proposal.pdf', { type: 'application/pdf' }),
                )
              }
            >
              Open file preview
            </Button>
            <Button size="sm" variant="outline" onClick={() => setContentPanelOpen(true)}>
              Open content panel
            </Button>
          </div>
          <div className="h-48 overflow-hidden rounded-md border border-border/60">
            <MobileAgentLayout
              showSidebar={showMobileSidebar}
              onToggleSidebar={() => setShowMobileSidebar((current) => !current)}
              sidebar={
                <div className="p-3 text-xs text-muted-foreground">
                  Conversation history panel (mobile)
                </div>
              }
              chat={
                <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
                  Chat area
                </div>
              }
            />
          </div>
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock
        title="AgentMessageList"
        meta="User · assistant · tool · card · confirmation message types"
        actions={
          <Button variant="outline" size="sm" onClick={resetThread}>
            Reset thread
          </Button>
        }
      >
        <div className="rounded-card border border-border/60 bg-background p-4">
          <AgentMessageList
            messages={messages}
            onConfirmationRespond={handleConfirmationRespond}
            onSkillApprovalRespond={handleSkillApprovalRespond}
          />
          {pendingConfirmations > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {pendingConfirmations} pending confirmation
              {pendingConfirmations === 1 ? '' : 's'} — approve or reject above.
            </p>
          ) : null}
        </div>
      </ShowcaseBlock>

      {previewFile ? (
        <ChatFilePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
      ) : null}
      <ContentPanel
        title="Thread details"
        open={contentPanelOpen}
        onClose={() => setContentPanelOpen(false)}
      >
        <p className="text-sm text-muted-foreground">
          Slide-over panel for auxiliary agent content — citations, tool traces, or record context.
        </p>
      </ContentPanel>
    </div>
  );
}
