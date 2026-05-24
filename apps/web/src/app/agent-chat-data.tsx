import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

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

function derivePromptSet(pathname?: string) {
  if (pathname?.startsWith('/clients')) {
    return [
      'Summarize client risk by status and contract timing.',
      'Draft a follow-up plan for inactive and churned accounts.',
      'Show which prospects need attention this week.',
    ];
  }
  if (pathname?.startsWith('/users')) {
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

function deriveAssistantResponse(params: {
  content: string;
  pathname?: string;
  userCount: number;
  clientCount: number;
  activeConversation: ChatConversationRecord | null;
}) {
  const lower = params.content.toLowerCase();
  const intro = params.pathname?.startsWith('/clients')
    ? `The client workspace currently has ${params.clientCount} visible demo records.`
    : params.pathname?.startsWith('/users')
      ? `The user workspace currently has ${params.userCount} visible demo records.`
      : 'The current shell is still compact, so I am reading this as an operational coordination request.';

  if (lower.includes('summary') || lower.includes('overview')) {
    return `${intro} Focus first on exceptions, then on deadlines, then on anything awaiting a decision. Keep the action list short and assignable.`;
  }

  if (lower.includes('client') || params.pathname?.startsWith('/clients')) {
    return `${intro} Prioritize churned and inactive accounts, then prospects with explicit notes. After that, queue renewal-sensitive active clients for outreach.`;
  }

  if (lower.includes('user') || lower.includes('access') || params.pathname?.startsWith('/users')) {
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
  const { users, clients } = useDemoData();
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

  const startNewConversation = (seed?: string) => {
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
  };

  const openConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  const deleteConversation = (conversationId: string) => {
    setConversations((current) => {
      const remaining = current.filter((conversation) => conversation.id !== conversationId);
      const fallbackId = remaining[0]?.id ?? '';
      if (conversationId === activeConversationId) {
        setActiveConversationId(fallbackId);
      }
      return remaining;
    });
  };

  const sendMessage = (content: string, options?: SendMessageOptions) => {
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
              title: conversation.messages.length <= 1 ? trimmed.slice(0, 42) : conversation.title,
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
  };

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
      getSuggestedPrompts: derivePromptSet,
    }),
    [activeConversation, activeConversationId, conversations, draft, isResponding],
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
