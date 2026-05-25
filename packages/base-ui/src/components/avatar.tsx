import * as AvatarPrimitive from '@radix-ui/react-avatar';
import type { ReactNode } from 'react';

import { getSemanticToneClasses } from '../lib/semanticPalette';
import { cn } from '../lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';
export type AvatarTone = 'muted' | 'accent' | 'primary';

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: 'h-5 w-5 [&_svg]:size-2.5',
  sm: 'h-7 w-7 [&_svg]:size-3.5',
  md: 'h-9 w-9 [&_svg]:size-4',
  lg: 'h-12 w-12 [&_svg]:size-5',
};

const TONE_CLASS: Record<AvatarTone, string> = {
  muted: getSemanticToneClasses('neutral', 'solid'),
  accent: getSemanticToneClasses('cta', 'solid'),
  primary: 'bg-primary/10 text-primary',
};

function DefaultPersonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

/** @deprecated Prefer passing an `icon` fallback — initials are no longer shown in Avatar. */
export function avatarInitials(label: string | null | undefined, maxLetters = 2): string {
  if (!label?.trim()) return '·';
  const tokens = label.trim().split(/\s+/);
  return (
    tokens
      .filter(Boolean)
      .slice(0, maxLetters)
      .map((t) => t.charAt(0).toUpperCase())
      .join('') || label.trim().charAt(0).toUpperCase()
  );
}

export interface AvatarProps {
  label?: string | null;
  src?: string | null;
  size?: AvatarSize;
  tone?: AvatarTone;
  /** Shown when `src` is missing — defaults to a person silhouette */
  icon?: ReactNode;
  overlay?: ReactNode;
  className?: string;
}

export function Avatar({
  label,
  src,
  size = 'md',
  tone = 'muted',
  icon,
  overlay,
  className,
}: AvatarProps) {
  const fallbackIcon = icon ?? <DefaultPersonIcon />;

  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full leading-none',
        SIZE_CLASS[size],
        TONE_CLASS[tone],
        className,
      )}
      aria-label={label?.trim() ?? 'User'}
    >
      {src ? (
        <AvatarPrimitive.Image src={src} alt="" className="h-full w-full object-cover" />
      ) : null}
      <AvatarPrimitive.Fallback
        delayMs={0}
        className="flex h-full w-full items-center justify-center"
      >
        {fallbackIcon}
      </AvatarPrimitive.Fallback>
      {overlay ? (
        <span className="pointer-events-none absolute -bottom-0.5 -right-0.5" aria-hidden>
          {overlay}
        </span>
      ) : null}
    </AvatarPrimitive.Root>
  );
}
