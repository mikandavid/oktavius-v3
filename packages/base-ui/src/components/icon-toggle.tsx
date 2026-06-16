import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/utils';

export type IconToggleTone = 'neutral' | 'info' | 'accent';

export interface IconToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** When true, renders the active/pressed tone and sets aria-pressed. */
  pressed?: boolean;
  /** Tone used while pressed. Defaults to 'neutral'. */
  tone?: IconToggleTone;
  /** Render a border ring (matches the web-search / memory toggles). */
  bordered?: boolean;
  children: ReactNode;
}

const PRESSED_TONE: Record<IconToggleTone, string> = {
  neutral: 'bg-muted text-foreground',
  info: 'border-info bg-info/10 text-info hover:bg-info/15 hover:text-info',
  accent: 'border-accent bg-accent/10 text-accent hover:bg-accent/15 hover:text-accent',
};

/** Round 28px icon control used in the agent composer toolbar. Icon passed as children. */
export function IconToggle({
  pressed = false,
  tone = 'neutral',
  bordered = false,
  className,
  type = 'button',
  children,
  ...props
}: IconToggleProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-40',
        bordered && 'border',
        pressed
          ? PRESSED_TONE[tone]
          : cn(
              'text-muted-foreground hover:bg-muted hover:text-foreground',
              bordered && 'border-transparent',
            ),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
