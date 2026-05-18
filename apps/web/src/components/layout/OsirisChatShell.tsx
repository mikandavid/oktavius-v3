import { useMemo, useRef, useState } from 'react';

import { Button, ScrollArea, cn } from '@oktavius/base-ui';

import {
  CloseIcon,
  HistoryIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
} from '@/lib/icons';
import { toast } from '@/lib/toast';

import { BrandMark } from './BrandMark';
import { ChatComposer } from './ChatComposer';
import { ConversationHistoryPanel, type ConversationHistoryItem } from './ConversationHistoryPanel';

type ShellMessage = {
  id: string;
  role: 'user';
  content: string;
  createdAt: string;
};

type ShellConversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: ShellMessage[];
};

type OsirisChatShellProps = {
  mode: 'page' | 'sidebar';
  className?: string;
  onCloseHistory?: () => void;
};

type SpeechRecognitionResultEvent = {
  results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('de-AT', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function OsirisChatShell({ mode, className, onCloseHistory }: OsirisChatShellProps) {
  const [conversations, setConversations] = useState<ShellConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(mode === 'page');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const fullWidthContentClass = 'mx-auto w-full max-w-5xl';
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
  const hasComposerContent = draft.trim().length > 0 || selectedFiles.length > 0;

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
    setConversations((current) => [nextConversation, ...current]);
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
    if (!content) return;

    const now = new Date().toISOString();
    const message: ShellMessage = {
      id: `message_${Date.now()}`,
      role: 'user',
      content,
      createdAt: now,
    };

    if (!activeConversationId) {
      const id = `chat_${Date.now()}`;
      setConversations([
        {
          id,
          title: trimmedDraft.slice(0, 42) || 'New chat',
          updatedAt: now,
          messages: [message],
        },
      ]);
      setActiveConversationId(id);
    } else {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeConversationId
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

    window.setTimeout(() => {
      const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport instanceof HTMLDivElement) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }, 0);
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
    recognition.onstart = () => setIsVoiceRecording(true);
    recognition.onend = () => setIsVoiceRecording(false);
    recognition.onerror = () => {
      setIsVoiceRecording(false);
      toast.error('Voice input failed. Try again.');
    };
    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      setDraft((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript));
    };
    recognition.start();
  };

  return (
    <div className={cn('flex h-full min-h-0 max-h-full flex-1 overflow-hidden bg-background', className)}>
      {showHistory ? (
        <div
          className={cn(
            'flex min-h-0 flex-col border-r bg-sidebar/60',
            mode === 'page' ? 'w-[320px]' : 'w-full border-r-0 border-b',
          )}
        >
          <ConversationHistoryPanel
            items={historyItems}
            activeItemId={activeConversationId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectItem={(conversationId) => {
              setActiveConversationId(conversationId);
              if (mode === 'sidebar') setShowHistory(false);
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
        </div>
      ) : null}

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
            <div className="flex shrink-0 items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={startNewConversation}
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
                  className="ml-auto max-w-[92%] rounded-2xl border border-foreground/10 bg-muted px-4 py-3"
                >
                  <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <span>You</span>
                    <span>{formatTimestamp(message.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{message.content}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed bg-card/70 px-5 py-8 text-center">
                <div className="mx-auto flex w-fit items-center justify-center rounded-xl border bg-muted/50 px-3 py-2">
                  <BrandMark />
                </div>
                <div className="mt-4 text-base font-semibold text-foreground">Start an Oktavius thread</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  The Osiris chat shell is in place. Connect an agent runtime here when ready.
                </p>
              </div>
            )}
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
              isLoading={false}
              submitDisabled={!hasComposerContent}
              placeholder="Ask Oktavius anything about the current workspace."
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
