import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { Badge, Button, Input, Popover, PopoverContent, PopoverTrigger, ScrollArea, Switch, cn } from '@oktavius/base-ui';

import { useAgentChat } from '@/app/agent-chat-data';
import {
  CloseIcon,
  DeleteIcon,
  HistoryIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
} from '@/lib/icons';
import { toast } from '@/lib/toast';

import { ChatComposer } from './ChatComposer';
import { BrandMark } from './BrandMark';

type AgentChatWorkspaceProps = {
  mode: 'page' | 'sidebar';
  className?: string;
  onCloseHistory?: () => void;
};

type SpeechRecognitionResultEvent = {
  results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
};

const historyStatusVariant = {
  Live: 'info',
  Queued: 'warning',
  Ready: 'success',
} as const;

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('de-AT', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function AgentChatWorkspace({
  mode,
  className,
  onCloseHistory,
}: AgentChatWorkspaceProps) {
  const fullWidthContentClass = 'mx-auto w-full max-w-5xl';
  const { pathname } = useLocation();
  const {
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
    getSuggestedPrompts,
  } = useAgentChat();
  const [historyQuery, setHistoryQuery] = useState('');
  const [showHistory, setShowHistory] = useState(mode === 'page');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [desktopAgentEnabled, setDesktopAgentEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const hasComposerContent = draft.trim().length > 0 || selectedFiles.length > 0;

  useEffect(() => {
    if (mode === 'page') {
      setShowHistory(true);
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport instanceof HTMLDivElement) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [activeConversation?.messages, isResponding]);

  const filteredConversations = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      return (
        conversation.title.toLowerCase().includes(query) ||
        conversation.summary.toLowerCase().includes(query)
      );
    });
  }, [conversations, historyQuery]);

  const prompts = getSuggestedPrompts(pathname);

  const submitDraft = () => {
    const trimmedDraft = draft.trim();
    const attachmentSummary =
      selectedFiles.length > 0 ? `Attached files: ${selectedFiles.map((file) => file.name).join(', ')}` : '';
    const composed = [trimmedDraft, attachmentSummary].filter(Boolean).join('\n\n');
    if (!composed.trim()) return;
    sendMessage(composed, { pathname });
    setSelectedFiles([]);
    setIsVoiceRecording(false);
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
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRecognitionCtor =
      browserWindow.SpeechRecognition ||
      browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      toast.error('Voice input is not available in this browser.');
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

    recognition.onstart = () => {
      setIsVoiceRecording(true);
    };

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      const nextDraft = draft.trim() ? `${draft.trim()} ${transcript}` : transcript;
      setDraft(nextDraft);
    };

    recognition.onerror = () => {
      setIsVoiceRecording(false);
      toast.error('Voice input failed. Try again.');
    };

    recognition.onend = () => {
      setIsVoiceRecording(false);
    };

    recognition.start();
  };

  const historyPanel = (
    <div
      className={cn(
        'flex min-h-0 flex-col border-r bg-sidebar/60',
        mode === 'page' ? 'w-[320px]' : 'w-full border-r-0 border-b',
      )}
    >
      <div className="border-b px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Conversation log
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">AI coordination</div>
          </div>
          {mode === 'sidebar' && onCloseHistory ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setShowHistory(false);
                onCloseHistory();
              }}
              aria-label="Close history"
            >
              <CloseIcon size={16} />
            </Button>
          ) : null}
        </div>
        <div className="relative mt-3">
          <SearchIcon
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={historyQuery}
            onChange={(event) => setHistoryQuery(event.target.value)}
            placeholder="Search threads"
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-2">
          {filteredConversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            return (
              <button
                key={conversation.id}
                onClick={() => {
                  openConversation(conversation.id);
                  if (mode === 'sidebar') {
                    setShowHistory(false);
                  }
                }}
                className={cn(
                  'flex w-full flex-col gap-2 rounded-lg border px-3 py-3 text-left transition-colors',
                  isActive
                    ? 'border-foreground/20 bg-muted'
                    : 'border-transparent hover:border-border hover:bg-background',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {conversation.title}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {conversation.summary}
                    </div>
                  </div>
                  <Badge variant={historyStatusVariant[conversation.status]}>{conversation.status}</Badge>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>{formatTimestamp(conversation.updatedAt)}</span>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Delete ${conversation.title}`}
                  >
                    <DeleteIcon size={14} />
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div
      className={cn(
        'flex h-full min-h-0 max-h-full flex-1 overflow-hidden bg-background',
        className,
      )}
    >
      {showHistory ? historyPanel : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="h-12 shrink-0 border-b border-border">
          <div className={cn('flex h-full w-full items-center gap-1.5 px-2', fullWidthContentClass)}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setShowHistory((current) => !current)}
              aria-label={showHistory ? 'Hide history' : 'Show history'}
              title="Conversation history"
            >
              <HistoryIcon size={16} />
            </Button>
            <div className="min-w-0 flex-1 px-1.5">
              <h2 className="truncate text-[13px] font-semibold text-foreground/90">
                {activeConversation?.title ?? 'Agent chat'}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Agent settings"
                  >
                    <Settings2Icon size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-0">
                  <div className="space-y-4 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Agent settings</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Match the Osiris shell pattern while keeping this extracted app lightweight.
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/30 p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex-1 text-left text-xs font-medium text-muted-foreground transition-colors',
                            !desktopAgentEnabled && 'text-foreground',
                          )}
                        >
                          Cloud agent
                        </div>
                        <Switch
                          checked={desktopAgentEnabled}
                          onCheckedChange={setDesktopAgentEnabled}
                          aria-label="Toggle desktop agent"
                        />
                        <div
                          className={cn(
                            'flex-1 text-right text-xs font-medium text-muted-foreground transition-colors',
                            desktopAgentEnabled && 'text-foreground',
                          )}
                        >
                          Desktop agent
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => startNewConversation()}
                title="New chat"
              >
                <PlusIcon size={14} />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea ref={scrollRef} className="min-h-0 flex-1">
          <div className={cn('flex w-full flex-col gap-4 px-3 py-4 md:px-5', fullWidthContentClass)}>
            {activeConversation?.messages.length ? (
              activeConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'max-w-[92%] rounded-2xl border px-4 py-3',
                    message.role === 'assistant'
                      ? 'mr-auto border-border bg-card'
                      : 'ml-auto border-foreground/10 bg-muted',
                  )}
                >
                  <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <span>{message.role === 'assistant' ? 'Assistant' : 'You'}</span>
                    <span>{formatTimestamp(message.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {message.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed bg-card/70 px-5 py-8 text-center">
                <div className="mx-auto flex w-fit items-center justify-center rounded-xl border bg-muted/50 px-3 py-2">
                  <BrandMark />
                </div>
                <div className="mt-4 text-base font-semibold text-foreground">
                  Start an Oktavius thread
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use this workspace for summaries, next actions, and drafting against the current module.
                </p>
              </div>
            )}

            <div className="grid gap-2 md:grid-cols-3">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setDraft(prompt);
                  }}
                  className="rounded-xl border bg-card px-3 py-3 text-left text-sm text-foreground transition-colors hover:border-foreground/20 hover:bg-muted/60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="shrink-0 bg-background px-3 pb-3 pt-2 md:px-4">
          <div className={cn('flex w-full flex-col gap-2', fullWidthContentClass)}>
            {selectedFiles.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="group flex items-center gap-1.5 rounded-md bg-muted/40 py-0.5 pl-2 pr-1 text-xs text-foreground/80 transition-colors hover:bg-muted/60"
                  >
                    <PaperclipIcon size={12} className="shrink-0 text-muted-foreground" />
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="rounded-md p-0.5 text-muted-foreground/50 transition-colors hover:text-foreground"
                    >
                      <CloseIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

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
              isLoading={isResponding}
              submitDisabled={!hasComposerContent || isResponding}
              placeholder="Ask for a summary, next actions, or a draft."
              leftControls={
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    tabIndex={-1}
                    title="Attach file"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <PaperclipIcon size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    tabIndex={-1}
                    title={isVoiceRecording ? 'Stop voice input' : 'Start voice input'}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                      isVoiceRecording
                        ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <MicIcon size={14} />
                  </button>
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
