/** Resolved theme for alias lookup (system resolved by caller). */
export type ResolvedTheme = 'light' | 'dark';

export const NEUTRAL_STEPS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** Semantic tokens that alias a neutral ramp step — edit the ramp, not these. */
export const NEUTRAL_DERIVED_ALIASES: Record<ResolvedTheme, Record<string, string>> = {
  light: {
    background: 'neutral-50',
    foreground: 'neutral-950',
    card: 'neutral-0',
    'card-foreground': 'neutral-950',
    popover: 'neutral-0',
    'popover-foreground': 'neutral-950',
    primary: 'neutral-900',
    'primary-foreground': 'neutral-50',
    secondary: 'neutral-100',
    'secondary-foreground': 'neutral-950',
    muted: 'neutral-100',
    'muted-foreground': 'neutral-600',
    'highlight-foreground': 'neutral-950',
    border: 'neutral-300',
    input: 'neutral-300',
    'accent-foreground': 'neutral-950',
    'warning-foreground': 'neutral-950',
    'sidebar-background': 'card',
    'sidebar-foreground': 'card-foreground',
    'sidebar-accent': 'neutral-200',
    'sidebar-accent-foreground': 'neutral-950',
    'sidebar-border': 'border',
  },
  dark: {
    background: 'neutral-50',
    foreground: 'neutral-950',
    card: 'neutral-100',
    'card-foreground': 'neutral-950',
    popover: 'neutral-200',
    'popover-foreground': 'neutral-950',
    primary: 'neutral-900',
    'primary-foreground': 'neutral-50',
    secondary: 'neutral-400',
    'secondary-foreground': 'neutral-950',
    muted: 'neutral-300',
    'muted-foreground': 'neutral-800',
    highlight: 'neutral-500',
    'highlight-foreground': 'neutral-950',
    border: 'neutral-600',
    input: 'neutral-600',
    'accent-foreground': 'neutral-950',
    'warning-foreground': 'neutral-50',
    'orange-foreground': 'neutral-50',
    'sidebar-background': 'card',
    'sidebar-foreground': 'card-foreground',
    'sidebar-accent': 'neutral-300',
    'sidebar-accent-foreground': 'neutral-950',
    'sidebar-border': 'border',
  },
};

export function getNeutralAlias(tokenKey: string, theme: ResolvedTheme): string | undefined {
  return NEUTRAL_DERIVED_ALIASES[theme][tokenKey];
}

export function isNeutralDerivedToken(tokenKey: string): boolean {
  return tokenKey in NEUTRAL_DERIVED_ALIASES.light || tokenKey in NEUTRAL_DERIVED_ALIASES.dark;
}

export function resolveThemeMode(preference: 'light' | 'dark' | 'system'): ResolvedTheme {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}

/** Human-readable surface stack for docs and playground. */
export const SURFACE_STACK = [
  {
    label: 'Page wash',
    className: 'bg-muted/40',
    token: 'muted/40',
    note: 'Only background tint in the app',
  },
  {
    label: 'Shell chrome',
    className: 'bg-card',
    token: 'card → neutral-0',
    note: 'Nav, header, chat rail',
  },
  {
    label: 'Card / panel',
    className: 'bg-card',
    token: 'card → neutral-0',
    note: 'CrudMainView, StatCard, Dialog',
  },
  {
    label: 'Input fill',
    className: 'bg-muted/60',
    token: 'muted/60',
    note: 'Filled controls, no border',
  },
  {
    label: 'Hover fill',
    className: 'bg-muted/80',
    token: 'muted/80',
    note: 'Input hover, ghost hover',
  },
] as const;

export const SEMANTIC_COLOR_TOKENS = [
  'cta',
  'destructive',
  'success',
  'warning',
  'info',
  'teal',
  'orange',
] as const;
