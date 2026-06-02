import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { resolveAppNavModuleForProfile } from '@/lib/appNavModules';
import { ORG_APEX_ID, getOrgProfile } from '@/lib/org-profiles/profiles';
import type { OrgProfile } from '@/lib/org-profiles/types';

import { useDemoData } from './demo-data';

export type ChatRole = 'user' | 'assistant';
export type ChatConversationStatus = 'Live' | 'Queued' | 'Ready';

export type ChatMessageRecord = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type ChatConversationRecord = {
  id: string;
  title: string;
  summary: string;
  status: ChatConversationStatus;
  updatedAt: string;
  messages: ChatMessageRecord[];
};

type SendMessageOptions = {
  pathname?: string;
};

type AgentChatContextValue = {
  conversations: ChatConversationRecord[];
  activeConversationId: string;
  activeConversation: ChatConversationRecord | null;
  draft: string;
  isResponding: boolean;
  setDraft: (value: string) => void;
  openConversation: (conversationId: string) => void;
  startNewConversation: (seed?: string) => void;
  deleteConversation: (conversationId: string) => void;
  sendMessage: (content: string, options?: SendMessageOptions) => void;
  getSuggestedPrompts: (pathname?: string) => string[];
};

const AgentChatContext = createContext<AgentChatContextValue | null>(null);

const makeMessage = (role: ChatRole, content: string, createdAt = new Date().toISOString()) => ({
  id: `${role}_${createdAt}_${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  createdAt,
});

const INITIAL_CONVERSATIONS: ChatConversationRecord[] = [];

function workspaceLabel(profile: OrgProfile, moduleId: string) {
  if (moduleId === 'clients') return profile.terminology.clientsSingular.toLowerCase();
  if (moduleId === 'cases') return profile.terminology.casesSingular.toLowerCase();
  if (moduleId === 'products') return profile.terminology.products.toLowerCase();
  return null;
}

function resolveAgentModule(pathname: string | undefined, profile: OrgProfile) {
  return pathname ? (resolveAppNavModuleForProfile(profile, pathname)?.id ?? null) : null;
}

function buildWorkspaceIntro(params: {
  moduleId: string | null;
  profile: OrgProfile;
  userCount: number;
  clientCount: number;
}) {
  const clientLabel = workspaceLabel(params.profile, 'clients') ?? 'client';
  const caseLabel = workspaceLabel(params.profile, 'cases') ?? 'case';
  const productLabel = workspaceLabel(params.profile, 'products') ?? 'products';

  if (params.moduleId === 'clients') {
    return `The ${clientLabel} workspace currently has ${params.clientCount} visible demo records.`;
  }

  if (params.moduleId === 'cases' || params.moduleId === 'cases-board') {
    return `The ${caseLabel} workspace is active.`;
  }

  if (params.moduleId === 'products') {
    return `The ${productLabel} workspace is active.`;
  }

  if (params.moduleId === 'users') {
    return `The user workspace currently has ${params.userCount} visible demo records.`;
  }

  return 'The current shell is still compact, so I am reading this as an operational coordination request.';
}

export function derivePromptSet(pathname?: string, profile = getOrgProfile(ORG_APEX_ID)) {
  const moduleId = resolveAgentModule(pathname, profile);
  const clientLabel = workspaceLabel(profile, 'clients') ?? 'client';

  if (moduleId === 'clients') {
    return [
      `Summarize ${clientLabel} risk by status and contract timing.`,
      'Draft a follow-up plan for inactive and churned accounts.',
      'Show which prospects need attention this week.',
    ];
  }

  if (moduleId === 'cases' || moduleId === 'cases-board') {
    const caseLabel = workspaceLabel(profile, 'cases') ?? 'case';
    return [
      `Summarize ${caseLabel} urgency, stage, and pending owner actions.`,
      `Draft the next handoff note for the active ${caseLabel}.`,
      `Show ${profile.terminology.cases.toLowerCase()} with deadlines or missing decisions.`,
    ];
  }

  if (moduleId === 'products') {
    const productLabel = workspaceLabel(profile, 'products') ?? 'products';
    return [
      `Summarize ${productLabel} coverage and stock-sensitive items.`,
      'Show items that need price, SKU, or availability review.',
      'Draft a short catalog cleanup plan.',
    ];
  }

  if (moduleId === 'users') {
    return [
      'Review pending and suspended user access.',
      'Draft a handoff note for admin approvals.',
      'Summarize role distribution and team coverage.',
    ];
  }
  return [
    'Give me the operational summary for this workspace.',
    'What should be reviewed first today?',
    'Draft next actions from the visible records.',
  ];
}

export function deriveAssistantResponse(params: {
  content: string;
  pathname?: string;
  profile?: OrgProfile;
  userCount: number;
  clientCount: number;
  activeConversation: ChatConversationRecord | null;
}) {
  const lower = params.content.toLowerCase();
  const profile = params.profile ?? getOrgProfile(ORG_APEX_ID);
  const moduleId = resolveAgentModule(params.pathname, profile);
  const intro = buildWorkspaceIntro({
    moduleId,
    profile,
    userCount: params.userCount,
    clientCount: params.clientCount,
  });

  if (lower.includes('summary') || lower.includes('overview')) {
    return `${intro} Focus first on exceptions, then on deadlines, then on anything awaiting a decision. Keep the action list short and assignable.`;
  }

  if (lower.includes('client') || lower.includes('contact') || moduleId === 'clients') {
    return `${intro} Prioritize churned and inactive accounts, then prospects with explicit notes. After that, queue renewal-sensitive active clients for outreach.`;
  }

  if (lower.includes('case') || moduleId === 'cases' || moduleId === 'cases-board') {
    return `${intro} Prioritize open deadlines, missing decisions, and owner handoffs before moving to routine follow-up.`;
  }

  if (lower.includes('product') || lower.includes('catalog') || moduleId === 'products') {
    return `${intro} Review incomplete item metadata, stock-sensitive entries, and anything tied to an active sales workflow first.`;
  }

  if (lower.includes('user') || lower.includes('access') || moduleId === 'users') {
    return `${intro} Review pending access first, then suspended members, then confirm whether admins and managers still match current responsibilities.`;
  }

  if (lower.includes('draft') || lower.includes('write') || lower.includes('message')) {
    return `${intro} I would structure the output as: context, current risk, owner, and next action. Keep it terse enough to paste into an internal note.`;
  }

  if (lower.includes('next') || lower.includes('todo') || lower.includes('action')) {
    return `${intro} The next best move is to convert this into three actions only: review exceptions, contact impacted records, and close any stale statuses before new intake starts.`;
  }

  return `${intro} I can turn this into a summary, next-action list, or drafting pass. The current conversation "${params.activeConversation?.title ?? 'New chat'}" is ready for either path.`;
}

export function AgentChatProvider({ children }: { children: ReactNode }) {
  const { users, clients, activeOrgId } = useDemoData();
  const profile = getOrgProfile(activeOrgId);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState(
    INITIAL_CONVERSATIONS[0]?.id ?? '',
  );
  const [draft, setDraft] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const pendingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current !== null) {
        window.clearTimeout(pendingTimeoutRef.current);
      }
    };
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  const startNewConversation = useCallback((seed?: string) => {
    const now = new Date().toISOString();
    const nextConversation: ChatConversationRecord = {
      id: `conv_${Date.now()}`,
      title: seed?.slice(0, 42) || 'New coordination thread',
      summary: 'Fresh workspace conversation',
      status: 'Live',
      updatedAt: now,
      messages: [],
    };

    setConversations((current) => [nextConversation, ...current]);
    setActiveConversationId(nextConversation.id);
    setDraft(seed ?? '');
  }, []);

  const openConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
  }, []);

  const deleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((current) => {
        const remaining = current.filter((conversation) => conversation.id !== conversationId);
        const fallbackId = remaining[0]?.id ?? '';
        if (conversationId === activeConversationId) {
          setActiveConversationId(fallbackId);
        }
        return remaining;
      });
    },
    [activeConversationId],
  );

  const sendMessage = useCallback(
    (content: string, options?: SendMessageOptions) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const now = new Date().toISOString();
      const targetConversationId = activeConversationId || `conv_${Date.now()}`;
      const userMessage = makeMessage('user', trimmed, now);

      setDraft('');
      setIsResponding(true);

      setConversations((current) => {
        const existing = current.find((conversation) => conversation.id === targetConversationId);
        if (!existing) {
          const created: ChatConversationRecord = {
            id: targetConversationId,
            title: trimmed.slice(0, 42),
            summary: 'Fresh workspace conversation',
            status: 'Live',
            updatedAt: now,
            messages: [userMessage],
          };
          setActiveConversationId(targetConversationId);
          return [created, ...current];
        }

        return current.map((conversation) =>
          conversation.id === targetConversationId
            ? {
                ...conversation,
                title:
                  conversation.messages.length <= 1 ? trimmed.slice(0, 42) : conversation.title,
                status: 'Live',
                updatedAt: now,
                messages: [...conversation.messages, userMessage],
              }
            : conversation,
        );
      });

      if (pendingTimeoutRef.current !== null) {
        window.clearTimeout(pendingTimeoutRef.current);
      }

      pendingTimeoutRef.current = window.setTimeout(() => {
        const reply = deriveAssistantResponse({
          content: trimmed,
          pathname: options?.pathname,
          profile,
          userCount: users.length,
          clientCount: clients.length,
          activeConversation,
        });
        const replyAt = new Date().toISOString();
        const assistantMessage = makeMessage('assistant', reply, replyAt);

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === targetConversationId
              ? {
                  ...conversation,
                  status: 'Ready',
                  updatedAt: replyAt,
                  messages: [...conversation.messages, assistantMessage],
                }
              : conversation,
          ),
        );
        setIsResponding(false);
        pendingTimeoutRef.current = null;
      }, 700);
    },
    [activeConversation, activeConversationId, clients.length, profile, users.length],
  );

  const value = useMemo<AgentChatContextValue>(
    () => ({
      conversations,
      activeConversationId,
      activeConversation,
      draft,
      isResponding,
      setDraft,
      openConversation,
      startNewConversation,
      deleteConversation,
      sendMessage,
      getSuggestedPrompts: (pathname?: string) => derivePromptSet(pathname, profile),
    }),
    [
      activeConversation,
      activeConversationId,
      conversations,
      deleteConversation,
      draft,
      isResponding,
      openConversation,
      profile,
      sendMessage,
      startNewConversation,
    ],
  );

  return <AgentChatContext.Provider value={value}>{children}</AgentChatContext.Provider>;
}

export function useAgentChat() {
  const context = useContext(AgentChatContext);
  if (!context) {
    throw new Error('useAgentChat must be used inside AgentChatProvider');
  }
  return context;
}
