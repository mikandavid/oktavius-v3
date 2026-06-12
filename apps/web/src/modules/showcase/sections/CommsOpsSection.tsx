import {
  Badge,
  Button,
  cn,
  Input,
  ListRow,
  RelativeTime,
  ScrollArea,
  Separator,
} from '@oktavius/base-ui';
import { useEffect, useRef, useState } from 'react';

import { NotificationPanel } from '@/components/layout/NotificationPanel';
import {
  BookOpenIcon,
  CheckIcon,
  DocumentIcon,
  NotificationsIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  SpinnerIcon,
  StopIcon,
  TeamIcon,
  TimeIcon,
} from '@/lib/icons';
import { appToast } from '@/lib/toast';

import { ShowcaseBlock } from '../shared';

// ─── Time tracking ──────────────────────────────────────────────────────────

type TimeEntry = {
  id: string;
  task: string;
  project: string;
  duration: number; // seconds
  date: string;
};

const INITIAL_ENTRIES: TimeEntry[] = [
  {
    id: 'te1',
    task: 'Client onboarding call',
    project: 'Apex Technologies',
    duration: 3720,
    date: '2024-12-10',
  },
  {
    id: 'te2',
    task: 'Contract review',
    project: 'Donau Logistics',
    duration: 5400,
    date: '2024-12-10',
  },
  {
    id: 'te3',
    task: 'Invoice reconciliation',
    project: 'Finance',
    duration: 1860,
    date: '2024-12-09',
  },
];

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function TimeTrackingBlock() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [task, setTask] = useState('');
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const handleStop = () => {
    if (elapsed === 0) return;
    setRunning(false);
    setEntries((current) => [
      {
        id: `te_${Date.now()}`,
        task: task || 'Untitled task',
        project: 'General',
        duration: elapsed,
        date: new Date().toISOString().slice(0, 10),
      },
      ...current,
    ]);
    setElapsed(0);
    setTask('');
    appToast.success('Time entry saved.');
  };

  const totalToday = entries
    .filter((e) => e.date === entries[0]?.date)
    .reduce((sum, e) => sum + e.duration, 0);

  return (
    <ShowcaseBlock title="Time tracking" meta="Timer widget · entry log · daily total">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-card border border-border/40 bg-muted/20 p-4">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              running ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
            )}
          >
            <TimeIcon size={18} weight={running ? 'fill' : 'regular'} />
          </div>
          <div className="min-w-0 flex-1">
            <Input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What are you working on?"
              className="h-8 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
          <span
            className={cn(
              'shrink-0 font-mono text-2xl font-semibold tabular-nums',
              running ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {formatDuration(elapsed)}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {!running ? (
              <Button size="sm" variant="cta" onClick={() => setRunning(true)}>
                <PlayIcon size={13} weight="fill" />
                Start
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setRunning(false)}>
                  <PauseIcon size={13} weight="fill" />
                  Pause
                </Button>
                <Button size="sm" variant="outline" onClick={handleStop}>
                  <StopIcon size={13} weight="fill" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between px-1 pb-1">
            <p className="text-xs font-medium text-muted-foreground">Recent entries</p>
            <p className="text-xs text-muted-foreground">
              Today:{' '}
              <span className="font-semibold text-foreground">{formatDuration(totalToday)}</span>
            </p>
          </div>
          {entries.slice(0, 4).map((entry) => (
            <ListRow
              key={entry.id}
              title={entry.task}
              subtitle={entry.project}
              meta={formatDuration(entry.duration)}
              leading={<TimeIcon size={14} className="mt-0.5 text-muted-foreground" />}
            />
          ))}
        </div>
      </div>
    </ShowcaseBlock>
  );
}

// ─── Group chat ─────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;
  author: string;
  initials: string;
  body: string;
  timestamp: string;
  self?: boolean;
  internal?: boolean;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    author: 'Anna Hofer',
    initials: 'AH',
    body: 'The Apex contract is ready for review — can you take a look before EOD?',
    timestamp: '2024-12-10T09:15:00Z',
  },
  {
    id: 'm2',
    author: 'Markus Leitner',
    initials: 'ML',
    body: 'Sure, on it. Should I send it directly or go through Nina first?',
    timestamp: '2024-12-10T09:22:00Z',
  },
  {
    id: 'm3',
    author: 'Anna Hofer',
    initials: 'AH',
    body: 'Go through Nina — she needs to sign off on the payment clause.',
    timestamp: '2024-12-10T09:24:00Z',
    internal: true,
  },
  {
    id: 'm4',
    author: 'You',
    initials: 'ME',
    body: "Got it, I'll loop Nina in on the next revision.",
    timestamp: '2024-12-10T09:31:00Z',
    self: true,
  },
];

function GroupChatBlock() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!draft.trim()) return;
    setMessages((current) => [
      ...current,
      {
        id: `m_${Date.now()}`,
        author: 'You',
        initials: 'ME',
        body: draft.trim(),
        timestamp: new Date().toISOString(),
        self: true,
      },
    ]);
    setDraft('');
  };

  return (
    <ShowcaseBlock
      title="Group chat"
      meta="Threaded team messaging · internal-note flag · @mention support"
      actions={
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TeamIcon size={13} />
          <span>Apex — Contract team</span>
        </div>
      }
    >
      <div className="flex flex-col gap-0 overflow-hidden rounded-card border border-border/40">
        <ScrollArea className="h-64" ref={scrollRef}>
          <div className="flex flex-col gap-3 p-3">
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-2.5', msg.self && 'flex-row-reverse')}>
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                    msg.self
                      ? 'bg-sidebar-primary/15 text-sidebar-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {msg.initials}
                </div>
                <div className={cn('flex max-w-[70%] flex-col gap-0.5', msg.self && 'items-end')}>
                  <div className="flex items-center gap-1.5">
                    {!msg.self && (
                      <span className="text-xs font-medium text-foreground">{msg.author}</span>
                    )}
                    {msg.internal && (
                      <Badge variant="outline" className="h-4 px-1 py-0 text-[10px]">
                        Internal
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      <RelativeTime date={msg.timestamp} />
                    </span>
                  </div>
                  <div
                    className={cn(
                      'rounded-control px-3 py-1.5 text-sm',
                      msg.self
                        ? 'bg-sidebar-primary/10 text-foreground'
                        : msg.internal
                          ? 'border border-warning/30 bg-warning/5 text-foreground'
                          : 'bg-muted text-foreground',
                    )}
                  >
                    {msg.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <div className="flex items-center gap-2 p-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message contract team…"
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button size="sm" variant="cta" onClick={handleSend} disabled={!draft.trim()}>
            <SendIcon size={13} />
          </Button>
        </div>
      </div>
    </ShowcaseBlock>
  );
}

// ─── Knowledge base ─────────────────────────────────────────────────────────

type KbArticle = {
  id: string;
  title: string;
  summary: string;
  category: string;
  views: number;
  updatedAt: string;
};

const KB_ARTICLES: KbArticle[] = [
  {
    id: 'kb1',
    title: 'How to create a contract template',
    summary:
      'Step-by-step guide for setting up reusable contract templates with custom fields and approval flows.',
    category: 'Contracts',
    views: 342,
    updatedAt: '2024-11-20',
  },
  {
    id: 'kb2',
    title: 'Invoice reconciliation checklist',
    summary:
      'Monthly reconciliation process: matching bank statements, resolving disputes, and marking invoices paid.',
    category: 'Finance',
    views: 219,
    updatedAt: '2024-10-08',
  },
  {
    id: 'kb3',
    title: 'Onboarding a new client',
    summary:
      'Complete client onboarding flow from initial intake through first invoice, including CRM setup.',
    category: 'Clients',
    views: 487,
    updatedAt: '2024-12-01',
  },
  {
    id: 'kb4',
    title: 'Setting up email sync (Nylas)',
    summary:
      'Connect your Google or Outlook account to sync emails and calendar events with the ERP.',
    category: 'Integrations',
    views: 155,
    updatedAt: '2024-11-05',
  },
];

const KB_CATEGORIES = ['All', 'Contracts', 'Finance', 'Clients', 'Integrations'];

function KnowledgeBaseBlock() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = KB_ARTICLES.filter((a) => {
    const matchCat = category === 'All' || a.category === category;
    const matchSearch =
      search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <ShowcaseBlock
      title="Knowledge base"
      meta="Article browser · category filter · search"
      actions={
        <Button size="sm" variant="cta">
          <PlusIcon size={13} />
          New article
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {KB_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                  cat === category
                    ? 'bg-sidebar-primary/10 text-sidebar-primary'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-6 text-center">
            <BookOpenIcon size={24} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No articles match your search.</p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {filtered.map((article) => (
              <button
                key={article.id}
                onClick={() => appToast.info(`Open article: ${article.title}`)}
                className="group flex flex-col gap-1 rounded-card border border-border/40 bg-card p-3 text-left transition-colors hover:border-border hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug text-foreground group-hover:text-sidebar-primary">
                    {article.title}
                  </p>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {article.category}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{article.summary}</p>
                <div className="flex items-center gap-2 pt-0.5 text-[10px] text-muted-foreground">
                  <span>{article.views} views</span>
                  <span>·</span>
                  <span>Updated {article.updatedAt}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </ShowcaseBlock>
  );
}

// ─── Doc processing / OCR ───────────────────────────────────────────────────

type ProcessingStep = 'upload' | 'ocr' | 'extract' | 'review';

const PROCESSING_STEPS: Array<{ key: ProcessingStep; label: string; description: string }> = [
  { key: 'upload', label: 'Upload', description: 'PDF received' },
  { key: 'ocr', label: 'OCR', description: 'Extracting text' },
  { key: 'extract', label: 'Extract', description: 'Parsing fields' },
  { key: 'review', label: 'Review', description: 'Confirm results' },
];

const EXTRACTED_FIELDS = [
  { label: 'Invoice number', value: 'INV-2024-8842', confidence: 0.98 },
  { label: 'Vendor name', value: 'Donau Logistics GmbH', confidence: 0.95 },
  { label: 'Issue date', value: '05.12.2024', confidence: 0.92 },
  { label: 'Due date', value: '04.01.2025', confidence: 0.91 },
  { label: 'Total amount', value: '€ 12.480,00', confidence: 0.99 },
  { label: 'VAT (20%)', value: '€ 2.080,00', confidence: 0.97 },
];

function DocProcessingBlock() {
  const [step, setStep] = useState<ProcessingStep>('ocr');

  const stepIndex = PROCESSING_STEPS.findIndex((s) => s.key === step);
  const isProcessing = step === 'ocr' || step === 'extract';

  const advance = () => {
    const next = PROCESSING_STEPS[stepIndex + 1];
    if (next) setStep(next.key);
    else appToast.success('Document processed and imported.');
  };

  const reset = () => setStep('upload');

  return (
    <ShowcaseBlock
      title="Doc processing"
      meta="OCR pipeline · field extraction · confidence scores"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-0">
          {PROCESSING_STEPS.map((s, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <div key={s.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                      done && 'bg-success/15 text-success',
                      active &&
                        'bg-sidebar-primary/10 text-sidebar-primary ring-2 ring-sidebar-primary/20',
                      !done && !active && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {done ? (
                      <CheckIcon size={13} weight="bold" />
                    ) : active && isProcessing ? (
                      <SpinnerIcon size={13} className="animate-spin" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      active
                        ? 'text-sidebar-primary'
                        : done
                          ? 'text-success'
                          : 'text-muted-foreground',
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < PROCESSING_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'mx-1 h-px flex-1',
                      i < stepIndex ? 'bg-success/50' : 'bg-border/60',
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {step === 'review' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-control border border-border/40 bg-muted/20 px-3 py-2">
              <DocumentIcon size={14} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                donau_invoice_dec2024.pdf — 6 fields extracted
              </p>
            </div>
            <div className="overflow-hidden rounded-control border border-border/40">
              {EXTRACTED_FIELDS.map((field, i) => (
                <div
                  key={field.label}
                  className={cn(
                    'flex items-center justify-between px-3 py-2',
                    i < EXTRACTED_FIELDS.length - 1 && 'border-b border-border/30',
                  )}
                >
                  <span className="text-xs text-muted-foreground">{field.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{field.value}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        field.confidence >= 0.95
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning',
                      )}
                    >
                      {Math.round(field.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-control border border-border/40 bg-muted/20 px-3 py-2.5">
            {isProcessing ? (
              <SpinnerIcon size={14} className="animate-spin text-sidebar-primary" />
            ) : (
              <CheckIcon size={14} className="text-success" weight="bold" />
            )}
            <p className="text-xs text-muted-foreground">
              {step === 'upload' && 'donau_invoice_dec2024.pdf received — ready to process.'}
              {step === 'ocr' && 'Extracting text from PDF… this takes a few seconds.'}
              {step === 'extract' && 'Parsing structured fields from extracted text…'}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {step !== 'review' ? (
            <Button size="sm" variant="cta" onClick={advance}>
              {isProcessing ? 'Simulate next step' : 'Advance'}
            </Button>
          ) : (
            <Button size="sm" variant="cta" onClick={advance}>
              <CheckIcon size={13} weight="bold" />
              Import fields
            </Button>
          )}
          {step !== 'upload' && (
            <Button size="sm" variant="outline" onClick={reset}>
              Reset demo
            </Button>
          )}
        </div>
      </div>
    </ShowcaseBlock>
  );
}

// ─── Notification feed ──────────────────────────────────────────────────────

function NotificationFeedBlock() {
  return (
    <ShowcaseBlock
      title="Notification feed"
      meta="Bell popover in AppLayout header — unread dot · mark-read · mark all"
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          The notification bell lives in the app header and is available on every route. Click below
          to open the popover:
        </p>
        <div className="flex items-center gap-3 rounded-control border border-border/40 bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <NotificationsIcon size={15} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Header bell →</span>
          </div>
          <NotificationPanel />
        </div>
        <p className="text-xs text-muted-foreground">
          Unread items show a filled dot on the trigger. Clicking an item marks it read. &ldquo;Mark
          all read&rdquo; clears the counter.
        </p>
      </div>
    </ShowcaseBlock>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

export function CommsOpsSection() {
  return (
    <div className="space-y-4">
      <TimeTrackingBlock />
      <GroupChatBlock />
      <KnowledgeBaseBlock />
      <DocProcessingBlock />
      <NotificationFeedBlock />
    </div>
  );
}
