import { cn } from '@oktavius/base-ui';

import { OctopusIcon } from './OctopusIcon';

type AgentThinkingIndicatorProps = {
  className?: string;
};

/** Inline loading state while the agent is generating — matches osiris_erp. */
export function AgentThinkingIndicator({ className }: AgentThinkingIndicatorProps) {
  return (
    <div className={cn('relative pl-9', className)}>
      <div className="absolute left-0 flex w-7 justify-center">
        <div className="flex h-[26px] w-[26px] animate-pulse items-center justify-center rounded-full border border-border bg-background text-primary/70">
          <OctopusIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 py-1.5 pl-0.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
