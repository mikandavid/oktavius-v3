import { cn } from '@oktavius/base-ui';

import { BotIcon } from '@/lib/icons';

import { DEFAULT_CONTEXT_WINDOW_TOKENS, formatTokenCount } from './agentHelpers';
import type { AgentTokenStats } from './types';

type ContextUsageIndicatorProps = {
  stats?: AgentTokenStats;
  tokens?: number;
  label?: string;
  compactLabel?: string;
  onCompact?: () => void;
  disabled?: boolean;
  className?: string;
};

/** Context window usage — ring variant for composer, bar variant for header. */
export function ContextUsageIndicator({
  stats,
  tokens: tokensProp,
  label = 'Context usage',
  compactLabel = 'Compact context',
  onCompact,
  disabled = false,
  className,
}: ContextUsageIndicatorProps) {
  const tokens = tokensProp ?? (stats ? stats.inputTokens + stats.outputTokens : 0);
  const windowTokens = stats?.contextWindowTokens ?? DEFAULT_CONTEXT_WINDOW_TOKENS;
  const clampedTokens = Math.max(0, tokens);
  const ratio = Math.min(clampedTokens / windowTokens, 1);
  const percent = Math.round(ratio * 100);
  const canCompact = ratio >= 0.7 && !disabled && !!onCompact;

  const size = 16;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);

  const colorClass =
    ratio >= 0.9 ? 'text-destructive' : ratio >= 0.7 ? 'text-warning' : 'text-primary';

  const tooltip = `${label}: ${percent}% (${formatTokenCount(clampedTokens)} / ${formatTokenCount(
    windowTokens,
  )})${ratio >= 0.7 ? ` · ${compactLabel}` : ''}`;

  return (
    <button
      type="button"
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
        canCompact &&
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        !canCompact && 'cursor-default',
        className,
      )}
      title={tooltip}
      aria-label={tooltip}
      disabled={!canCompact}
      tabIndex={canCompact ? 0 : -1}
      onClick={canCompact ? onCompact : undefined}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn('overflow-visible', colorClass)}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 250ms ease-out' }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={2}
          fill="currentColor"
          className={cn(
            'transition-opacity duration-200',
            ratio >= 0.7 ? 'opacity-100' : 'opacity-0',
          )}
        />
      </svg>
    </button>
  );
}

/** Compact token count badge for chat header. */
export function TokenBadge({ stats }: { stats: AgentTokenStats }) {
  const total = stats.inputTokens + stats.outputTokens;
  return (
    <span className="rounded-control bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
      {formatTokenCount(total)} tok
    </span>
  );
}

/** Legacy header bar variant — kept for showcase compatibility. */
export function ContextUsageBar({
  stats,
  className,
}: {
  stats: AgentTokenStats;
  className?: string;
}) {
  const used = stats.inputTokens + stats.outputTokens;
  const ratio = stats.contextWindowTokens > 0 ? used / stats.contextWindowTokens : 0;
  const percent = Math.min(100, Math.round(ratio * 100));

  return (
    <div
      className={cn('flex items-center gap-2 text-[11px] text-muted-foreground', className)}
      title={`${formatTokenCount(used)} / ${formatTokenCount(stats.contextWindowTokens)} tokens`}
    >
      <BotIcon size={12} className="shrink-0" />
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-[width]',
            percent >= 85 ? 'bg-destructive' : percent >= 65 ? 'bg-warning' : 'bg-cta',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span>{percent}%</span>
    </div>
  );
}
