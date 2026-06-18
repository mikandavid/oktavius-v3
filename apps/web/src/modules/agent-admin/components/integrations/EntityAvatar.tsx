import { cn } from '@oktavius/base-ui';
import { type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// EntityAvatar — shared avatar used by AddConnectionDialog and ConnectionRow.
// Props are the union/superset of both call sites' needs.
// ---------------------------------------------------------------------------

export type EntityAvatarSize = 'xs' | 'sm' | 'md' | 'lg';
export type EntityAvatarTone = 'muted' | 'accent' | 'primary' | 'sidebar';

export interface EntityAvatarProps {
  label: string | null | undefined;
  abbreviation?: string | null;
  src?: string | null;
  size?: EntityAvatarSize;
  tone?: EntityAvatarTone;
  className?: string;
  overlay?: ReactNode;
}

const AVATAR_SIZE: Record<EntityAvatarSize, string> = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

const AVATAR_TONE: Record<EntityAvatarTone, string> = {
  muted: 'bg-muted text-muted-foreground',
  accent: 'bg-accent text-accent-foreground',
  primary: 'bg-primary/10 text-primary',
  sidebar: 'bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground',
};

function entityInitials(label: string | null | undefined): string {
  if (!label) return '·';
  const trimmed = label.trim();
  if (!trimmed) return '·';
  const tokens = trimmed.split(/\s+/);
  return (
    tokens
      .filter(Boolean)
      .slice(0, 2)
      .map((t) => t.charAt(0).toUpperCase())
      .join('') || trimmed.charAt(0).toUpperCase()
  );
}

export function EntityAvatar({
  label,
  abbreviation,
  src,
  size = 'md',
  tone = 'muted',
  className,
  overlay,
}: EntityAvatarProps) {
  const text = abbreviation?.trim() || entityInitials(label);
  const accessibleLabel = label?.trim() ?? text;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold leading-none select-none',
        AVATAR_SIZE[size],
        AVATAR_TONE[tone],
        className,
      )}
      aria-label={accessibleLabel}
      role="img"
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            (event.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span aria-hidden>{text}</span>
      )}
      {overlay ? (
        <span className="pointer-events-none absolute -right-0.5 -bottom-0.5" aria-hidden>
          {overlay}
        </span>
      ) : null}
    </span>
  );
}
