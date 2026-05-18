import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as React from 'react';

import { cn } from '../lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';
export type AvatarTone = 'muted' | 'accent' | 'primary';

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

const TONE_CLASS: Record<AvatarTone, string> = {
  muted: 'bg-muted text-muted-foreground',
  accent: 'bg-accent text-accent-foreground',
  primary: 'bg-primary/10 text-primary',
};

/** Derive 1-2 uppercase initials from a display name. */
export function avatarInitials(label: string | null | undefined, maxLetters = 2): string {
  if (!label?.trim()) return '·';
  const tokens = label.trim().split(/\s+/);
  return tokens
    .filter(Boolean)
    .slice(0, maxLetters)
    .map((t) => t.charAt(0).toUpperCase())
    .join('') || label.trim().charAt(0).toUpperCase();
}

export interface AvatarProps {
  label?: string | null;
  /** Explicit short label override (abbreviation, username). */
  abbreviation?: string | null;
  src?: string | null;
  size?: AvatarSize;
  tone?: AvatarTone;
  /** Overlay slot — presence dot, status indicator. */
  overlay?: React.ReactNode;
  className?: string;
}

export function Avatar({
  label,
  abbreviation,
  src,
  size = 'md',
  tone = 'muted',
  overlay,
  className,
}: AvatarProps) {
  const text = abbreviation?.trim() || avatarInitials(label);

  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold leading-none',
        SIZE_CLASS[size],
        TONE_CLASS[tone],
        className,
      )}
      aria-label={label?.trim() ?? text}
    >
      {src ? (
        <AvatarPrimitive.Image
          src={src}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback delayMs={0}>
        <span aria-hidden>{text}</span>
      </AvatarPrimitive.Fallback>
      {overlay ? (
        <span className="pointer-events-none absolute -bottom-0.5 -right-0.5" aria-hidden>
          {overlay}
        </span>
      ) : null}
    </AvatarPrimitive.Root>
  );
}
