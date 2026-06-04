export const MINI_CALENDAR_CLASS_NAMES = {
  nav: 'flex w-full items-center justify-between',
  weekdays: 'grid grid-cols-7',
  week: 'grid grid-cols-7',
  selected:
    '[&>button]:bg-cta [&>button]:text-cta-foreground [&>button]:hover:bg-cta [&>button]:hover:text-cta-foreground',
} as const;

/** Layout classes that must stay in sync — regression guard for agent edits. */
export const MINI_CALENDAR_FORBIDDEN_NAV_PATTERNS = [
  'absolute left-1',
  'absolute right-1',
] as const;
