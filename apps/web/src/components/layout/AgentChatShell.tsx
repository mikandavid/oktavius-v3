import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  formatDisplayDateTime,
  IconToggle,
  MouseTooltip,
  ScrollArea,
} from '@oktavius/base-ui';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getAttachmentIcon } from '@/components/agent/agentHelpers';
import { AgentMessageList } from '@/components/agent/AgentMessageList';
import { createConfiguredAgentTransport, runAgentTurn } from '@/components/agent/agentRuntime';
import { AgentThinkingIndicator } from '@/components/agent/AgentThinkingIndicator';
import { AgentWelcomeScreen } from '@/components/agent/AgentWelcomeScreen';
import { ChatFilePreviewDialog } from '@/components/agent/ChatFilePreviewDialog';
import {
  loadStoredChatConversations,
  storeChatConversations,
  type StoredChatConversation,
  trimChatConversations,
} from '@/components/agent/chatStorage';
import { EditableConversationTitle } from '@/components/agent/EditableConversationTitle';
import { useAgentPageContext } from '@/components/agent/page-context';
import { captureAgentPageContext } from '@/components/agent/page-routing';
import type { AgentMessage, AgentModelMode } from '@/components/agent/types';
import { RecordingBar } from '@/components/agent/VoiceRecorder';
import { APP_SHELL_BORDER_CLASS, APP_SHELL_SURFACE_CLASS } from '@/components/common/pageChrome';
import {
  BrainIcon,
  ChevronDownIcon,
  CloseIcon,
  GlobeIcon,
  HistoryIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
} from '@/lib/icons';
import { getWindowStorage } from '@/lib/storage/safeStorage';
import { appToast } from '@/lib/toast';

import { ChatComposer } from './ChatComposer';
import { type ConversationHistoryItem, ConversationHistoryPanel } from './ConversationHistoryPanel';
import { MobileAgentLayout } from './MobileAgentLayout';

type ShellConversation = StoredChatConversation;

type AgentChatShellProps = {
  mode: 'page' | 'sidebar' | 'module';
  className?: string;
  onCloseHistory?: () => void;
};

type SpeechRecognitionResultEvent = {
  results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

const MODEL_MODE_LABEL: Record<AgentModelMode, string> = {
  default: 'Default',
  thinking: 'Thinking',
  fast: 'Blitz',
};

function mergeConversationMessages(currentMessages: AgentMessage[], nextMessages: AgentMessage[]) {
  const merged = [...currentMessages];
  for (const message of nextMessages) {
    const existingIndex = merged.findIndex((entry) => entry.id === message.id);
    if (existingIndex >= 0) {
      merged[existingIndex] = message;
      continue;
    }
    merged.push(message);
  }
  return merged;
}

function getChatStorage() {
  return getWindowStorage('localStorage');
}

export function AgentChatShell({ mode, className, onCloseHistory }: AgentChatShellProps) {
  const pageContext = useAgentPageContext();
  const agentTransport = useMemo(
    () => createConfiguredAgentTransport({ env: import.meta.env }),
    [],
  );
  const [conversations, setConversations] = useState<ShellConversation[]>(() =>
    loadStoredChatConversations(getChatStorage()),
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    () => loadStoredChatConversations(getChatStorage())[0]?.id ?? null,
  );
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(mode === 'page');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isAssistantPending, setIsAssistantPending] = useState(false);
  const [modelMode, setModelMode] = useState<AgentModelMode>('default');
  const [webSearchMode, setWebSearchMode] = useState(false);
  const [instructionUpdateMode, setInstructionUpdateMode] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isMobilePageLayout, setIsMobilePageLayout] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const fullWidthContentClass = 'mx-auto w-full max-w-5xl';
  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
  const latestConversation = conversations[0] ?? null;
  const hasComposerContent = draft.trim().length > 0 || selectedFiles.length > 0;
  const composerPlaceholder = pageContext.primaryEntity?.displayLabel
    ? `Ask about ${pageContext.primaryEntity.displayLabel}…`
    : pageContext.moduleLabel
      ? `Ask about ${pageContext.moduleLabel.toLowerCase()}…`
      : 'Ask Oktavius anything about the current workspace.';

  useEffect(() => {
    storeChatConversations(getChatStorage(), conversations);
  }, [conversations]);

  useEffect(() => {
    if (mode !== 'page') {
      setIsMobilePageLayout(false);
      return;
    }
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobilePageLayout(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, [mode]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => conversation.title.toLowerCase().includes(query));
  }, [conversations, searchQuery]);

  const historyItems: ConversationHistoryItem[] = filteredConversations.map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt,
  }));

  const startNewConversation = () => {
    const id = `chat_${Date.now()}`;
    const now = new Date().toISOString();
    const nextConversation: ShellConversation = {
      id,
      title: 'New chat',
      updatedAt: now,
      messages: [],
    };
    setConversations((current) => trimChatConversations([nextConversation, ...current]));
    setActiveConversationId(id);
    setDraft('');
    setSelectedFiles([]);
    setShowHistory(false);
  };

  const submitDraft = () => {
    const trimmedDraft = draft.trim();
    const attachmentSummary =
      selectedFiles.length > 0
        ? `Attached files: ${selectedFiles.map((file) => file.name).join(', ')}`
        : '';
    const content = [trimmedDraft, attachmentSummary].filter(Boolean).join('\n\n').trim();
    if (!content || isAssistantPending) return;

    const now = new Date().toISOString();
    const message: AgentMessage = {
      id: `message_${Date.now()}`,
      role: 'user',
      content,
      createdAt: now,
    };

    const appendToConversation = (conversationId: string, nextMessages: AgentMessage[]) => {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                updatedAt: now,
                messages: mergeConversationMessages(conversation.messages, nextMessages),
              }
            : conversation,
        ),
      );
    };

    let targetConversationId = activeConversationId;

    if (!targetConversationId) {
      const id = `chat_${Date.now()}`;
      targetConversationId = id;
      setConversations(
        trimChatConversations([
          {
            id,
            title: trimmedDraft.slice(0, 42) || 'New chat',
            updatedAt: now,
            messages: [message],
          },
        ]),
      );
      setActiveConversationId(id);
    } else {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === targetConversationId
            ? {
                ...conversation,
                title:
                  conversation.messages.length === 0 && trimmedDraft
                    ? trimmedDraft.slice(0, 42)
                    : conversation.title,
                updatedAt: now,
                messages: [...conversation.messages, message],
              }
            : conversation,
        ),
      );
    }

    setDraft('');
    setSelectedFiles([]);
    setIsVoiceRecording(false);
    setIsAssistantPending(true);

    window.setTimeout(() => {
      const pageSnapshot = captureAgentPageContext(document, window.location.href, pageContext);
      void runAgentTurn({
        content,
        createdAt: new Date().toISOString(),
        pageSnapshot,
        transport: agentTransport,
        onStreamMessage: (message) => {
          if (targetConversationId) {
            appendToConversation(targetConversationId, [message]);
          }
        },
      })
        .then((followUp) => {
          if (targetConversationId) {
            appendToConversation(targetConversationId, followUp);
          }
        })
        .catch((error: unknown) => {
          appToast.fromApiError(error, 'Oktavius could not complete the request.');
        })
        .finally(() => {
          setIsAssistantPending(false);
          const viewport = scrollRef.current?.parentElement;
          if (viewport) viewport.scrollTop = viewport.scrollHeight;
        });
    }, 900);

    window.setTimeout(() => {
      const viewport = scrollRef.current?.parentElement;
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }, 0);
  };

  const handleConfirmationRespond = (messageId: string, approved: boolean) => {
    setConversations((current) =>
      current.map((conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
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
      })),
    );
    appToast.success(approved ? 'Action approved.' : 'Action rejected.');
  };

  const renameConversation = (conversationId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, title: trimmed } : conversation,
      ),
    );
  };

  const deleteConversation = (conversationId: string) => {
    setConversations((current) => {
      const remaining = current.filter((conversation) => conversation.id !== conversationId);
      if (activeConversationId === conversationId) {
        setActiveConversationId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setSelectedFiles((current) => [...current, ...files]);
    event.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const toggleVoiceInput = () => {
    const browserWindow = window as typeof window & {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    };
    const SpeechRecognitionCtor =
      browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      appToast.error('Voice input is not available in this browser.');
      return;
    }

    if (isVoiceRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsVoiceRecording(true);
    recognition.onend = () => setIsVoiceRecording(false);
    recognition.onerror = () => {
      setIsVoiceRecording(false);
      appToast.error('Voice input failed. Try again.');
    };
    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      setDraft((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript));
    };
    recognition.start();
  };

  const historyPanel = (
    <ConversationHistoryPanel
      items={historyItems}
      activeItemId={activeConversationId}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSelectItem={(conversationId) => {
        setActiveConversationId(conversationId);
        if (mode === 'sidebar' || isMobilePageLayout) setShowHistory(false);
      }}
      onCreateItem={startNewConversation}
      onBack={() => {
        setShowHistory(false);
        onCloseHistory?.();
      }}
      onDeleteItem={deleteConversation}
      onRenameItem={renameConversation}
      title="Conversations"
      placeholder="Search threads"
      closeLabel="Close history"
      fullWidth={false}
    />
  );

  const chatColumn = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="h-12 shrink-0">
        <div className={cn('flex h-full w-full items-center gap-1.5 px-2', fullWidthContentClass)}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setShowHistory((current) => !current)}
            aria-label={showHistory ? 'Hide history' : 'Show history'}
          >
            <HistoryIcon size={16} />
          </Button>
          <div className="min-w-0 flex-1 px-1.5">
            <EditableConversationTitle
              conversationId={activeConversationId}
              title={activeConversation?.title ?? null}
              fallbackTitle="Agent chat"
              onRename={renameConversation}
            />
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={startNewConversation}
              aria-label="New chat"
            >
              <PlusIcon size={14} />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div
          ref={scrollRef}
          className={cn('flex w-full flex-col gap-4 px-4 py-4 md:px-6', fullWidthContentClass)}
        >
          {activeConversation?.messages.length ? (
            <AgentMessageList
              messages={activeConversation.messages}
              onConfirmationRespond={handleConfirmationRespond}
            />
          ) : (
            <AgentWelcomeScreen
              title="How can I help?"
              subtitle='Ask about clients, tasks, or try "delete client" to see a confirmation card.'
              latestConversationTitle={latestConversation?.title}
              latestConversationTime={
                latestConversation?.updatedAt
                  ? formatDisplayDateTime(latestConversation.updatedAt)
                  : undefined
              }
              onOpenLatestConversation={
                latestConversation
                  ? () => {
                      setActiveConversationId(latestConversation.id);
                    }
                  : undefined
              }
            />
          )}
          {isAssistantPending ? <AgentThinkingIndicator /> : null}
        </div>
      </ScrollArea>

      {selectedFiles.length > 0 ? (
        <div className="shrink-0 border-t border-border px-3 py-1.5">
          <div className={cn('flex flex-wrap gap-1.5', fullWidthContentClass)}>
            {selectedFiles.map((file, index) => {
              const FileIcon = getAttachmentIcon(file.name, file.type);
              return (
                <div
                  key={`${file.name}-${index}`}
                  className="group flex items-center gap-1.5 rounded-md bg-muted/40 py-0.5 pl-2 pr-1 text-xs text-foreground/80 transition-colors hover:bg-muted/60"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="flex min-w-0 items-center gap-1.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Preview ${file.name}`}
                  >
                    <FileIcon size={14} className="shrink-0 text-muted-foreground" />
                    <span className="max-w-[110px] truncate">{file.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeSelectedFile(index);
                    }}
                    className="ml-0.5 shrink-0 rounded-md p-0.5 text-muted-foreground/50 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Remove ${file.name}`}
                  >
                    <CloseIcon size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {isVoiceRecording ? (
        <div className={cn('shrink-0 px-3 pb-1', fullWidthContentClass)}>
          <RecordingBar isRecording={isVoiceRecording} />
        </div>
      ) : null}

      <div className="shrink-0 px-3 pb-3 pt-2">
        <div className={cn('flex w-full flex-col gap-2', fullWidthContentClass)}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.xlsx,.xls,.csv,.json,.txt,.docx,.doc"
            className="hidden"
            onChange={handleFileSelection}
          />

          <ChatComposer
            value={draft}
            onValueChange={setDraft}
            onSubmit={submitDraft}
            onStop={() => {
              recognitionRef.current?.stop();
              setIsVoiceRecording(false);
            }}
            isLoading={isAssistantPending}
            submitDisabled={!hasComposerContent || isAssistantPending}
            placeholder={composerPlaceholder}
            rightControls={
              <MouseTooltip content={isVoiceRecording ? 'Stop voice input' : 'Start voice input'}>
                <IconToggle
                  pressed={isVoiceRecording}
                  tone="neutral"
                  onClick={toggleVoiceInput}
                  tabIndex={-1}
                  aria-label={isVoiceRecording ? 'Stop voice input' : 'Start voice input'}
                  className={cn(
                    isVoiceRecording &&
                      'bg-destructive/10 text-destructive hover:bg-destructive/20',
                  )}
                >
                  <MicIcon size={14} />
                </IconToggle>
              </MouseTooltip>
            }
            bottomControls={
              <>
                <IconToggle
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAssistantPending}
                  tabIndex={-1}
                  aria-label="Attach file"
                  title="Attach file"
                >
                  <PaperclipIcon size={14} />
                </IconToggle>
                <IconToggle
                  bordered
                  tone="info"
                  pressed={webSearchMode}
                  onClick={() => setWebSearchMode((current) => !current)}
                  disabled={isAssistantPending}
                  aria-label="Web search mode"
                  title="Web search mode"
                >
                  <GlobeIcon size={14} />
                </IconToggle>
                <IconToggle
                  bordered
                  tone="accent"
                  pressed={instructionUpdateMode}
                  onClick={() => setInstructionUpdateMode((current) => !current)}
                  disabled={isAssistantPending}
                  aria-label="Instruction update mode"
                  title="Instruction update mode"
                >
                  <BrainIcon size={14} />
                </IconToggle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={isAssistantPending}
                      className="flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                      aria-label="Model mode"
                    >
                      <span>{MODEL_MODE_LABEL[modelMode]}</span>
                      <ChevronDownIcon size={14} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-52 rounded-[22px] p-1.5 shadow-none"
                  >
                    <DropdownMenuRadioGroup
                      value={modelMode}
                      onValueChange={(value) => setModelMode(value as AgentModelMode)}
                    >
                      <DropdownMenuRadioItem value="fast" className="rounded-full px-3">
                        Blitz
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="default" className="rounded-full px-3">
                        Default
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="thinking" className="rounded-full px-3">
                        Thinking
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="ml-auto" />
              </>
            }
          />
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        'relative flex h-full min-h-0 max-h-full flex-1 overflow-hidden',
        APP_SHELL_SURFACE_CLASS,
        className,
      )}
    >
      {mode === 'page' && isMobilePageLayout ? (
        <MobileAgentLayout
          showSidebar={showHistory}
          onToggleSidebar={() => setShowHistory((current) => !current)}
          sidebar={
            <div
              className={cn(
                'flex h-full min-h-0 flex-col border-r bg-muted/30',
                APP_SHELL_BORDER_CLASS,
              )}
            >
              {historyPanel}
            </div>
          }
          chat={chatColumn}
        />
      ) : (
        <>
          {showHistory ? (
            <div
              className={cn(
                'flex min-h-0 flex-col border-r bg-muted/30',
                APP_SHELL_BORDER_CLASS,
                mode === 'page' ? 'w-[320px]' : 'w-full border-r-0 border-b',
              )}
            >
              {historyPanel}
            </div>
          ) : null}
          {chatColumn}
        </>
      )}

      {previewFile ? (
        <ChatFilePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
      ) : null}
    </div>
  );
}
