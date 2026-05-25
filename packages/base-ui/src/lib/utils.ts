import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Hover/active/focus for custom clickable surfaces (rows, cards, div[role=button]). */
export const interactiveSurfaceClasses =
  'cursor-pointer transition-colors duration-150 ease-out hover:bg-muted/50 active:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

/** Hover/focus for text-style click targets (links, ghost labels). */
export const interactiveTextClasses =
  'cursor-pointer transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-sm';
