import { cn } from '@oktavius/base-ui';

import { ChevronRightIcon, MessageSquareIcon } from '@/lib/icons';

import { OctopusIcon } from './OctopusIcon';

type AgentWelcomeScreenProps = {
  title?: string;
  subtitle?: string;
  latestConversationTitle?: string;
  latestConversationTime?: string;
  onOpenLatestConversation?: () => void;
  onStartNew?: () => void;
  className?: string;
};

/** Empty state for agent chat — compact ERP tone (not marketing hero). */
export function AgentWelcomeScreen({
  title = 'How can I help?',
  subtitle = 'Ask about records, tasks, documents, or let the agent propose next steps.',
  latestConversationTitle,
  latestConversationTime,
  onOpenLatestConversation,
  className,
}: AgentWelcomeScreenProps) {
  return (
    <div className={cn('flex min-h-[40vh] flex-col justify-center px-4 py-6', className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-muted/60">
          <OctopusIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {latestConversationTitle && onOpenLatestConversation ? (
        <button
          type="button"
          onClick={onOpenLatestConversation}
          className="group mt-5 flex w-full max-w-md items-center gap-2 rounded-control border border-border/60 bg-card px-3 py-2 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open latest conversation"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-muted/50 text-muted-foreground transition-colors group-hover:text-foreground">
            <MessageSquareIcon size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Latest chat
            </span>
            <span className="block truncate text-xs font-medium text-foreground">
              {latestConversationTitle}
            </span>
          </span>
          {latestConversationTime ? (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {latestConversationTime}
            </span>
          ) : null}
          <ChevronRightIcon
            size={14}
            className="shrink-0 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground"
          />
        </button>
      ) : null}
    </div>
  );
}
