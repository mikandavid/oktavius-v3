import { NEUTRAL_STEPS } from './tokenAliases';

export type TokenFormat = 'hsl' | 'oklch' | 'length' | 'time' | 'shadow' | 'font';

export type TokenGroup =
  | 'neutral'
  | 'surfaces'
  | 'borders'
  | 'brand'
  | 'semantic'
  | 'shell'
  | 'radius'
  | 'shadows'
  | 'motion'
  | 'typography';

export type DesignToken = {
  key: string;
  label: string;
  group: TokenGroup;
  format: TokenFormat;
  description?: string;
  /** When true, value is derived from neutral ramp — edit the alias target instead. */
  derived?: boolean;
};

/** Group order matches design-system layers: ramp → roles → brand → layout. */
export const TOKEN_GROUPS: Array<{ key: TokenGroup; label: string; description: string }> = [
  {
    key: 'neutral',
    label: 'Neutral ramp',
    description: 'Layer 1 — edit these to retune all gray UI',
  },
  {
    key: 'surfaces',
    label: 'Surface roles',
    description: 'Layer 2 — read-only aliases into the ramp',
  },
  {
    key: 'borders',
    label: 'Borders',
    description: 'Rules and input chrome — aliases into the ramp',
  },
  {
    key: 'brand',
    label: 'Brand & main color',
    description: 'CTA violet, accent tint, focus ring',
  },
  {
    key: 'semantic',
    label: 'State & info colors',
    description: 'Success, warning, info, destructive, calendar',
  },
  {
    key: 'shell',
    label: 'Shell & nav',
    description: 'Sidebar active state — background uses bg-card',
  },
  {
    key: 'radius',
    label: 'Radius',
    description: 'Corner rounding scale',
  },
  {
    key: 'shadows',
    label: 'Shadows',
    description: 'Elevation (cards stay flat — shadow-card is none)',
  },
  {
    key: 'motion',
    label: 'Motion',
    description: 'Transition durations',
  },
  {
    key: 'typography',
    label: 'Typography',
    description: 'Font stacks',
  },
];

export const DESIGN_TOKENS: DesignToken[] = [
  // Layer 1 — neutral ramp
  {
    key: 'neutral-0',
    label: 'Neutral 0',
    group: 'neutral',
    format: 'hsl',
    description: 'Pure white — card surface (light mode)',
  },
  ...NEUTRAL_STEPS.filter((step) => step !== 0).map(
    (step): DesignToken => ({
      key: `neutral-${step}`,
      label: `Neutral ${step}`,
      group: 'neutral',
      format: 'hsl',
      description:
        step <= 300
          ? 'Surface steps — backgrounds, cards, muted fills'
          : step <= 600
            ? 'Border and secondary text'
            : 'Primary text and dark fills',
    }),
  ),

  // Layer 2 — surface roles (derived)
  {
    key: 'background',
    label: 'Background',
    group: 'surfaces',
    format: 'hsl',
    derived: true,
    description: '→ neutral-50',
  },
  {
    key: 'foreground',
    label: 'Foreground',
    group: 'surfaces',
    format: 'hsl',
    derived: true,
    description: '→ neutral-950',
  },
  {
    key: 'card',
    label: 'Card',
    group: 'surfaces',
    format: 'hsl',
    derived: true,
    description: '→ neutral-0 (light) / neutral-100 (dark)',
  },
  {
    key: 'card-foreground',
    label: 'Card foreground',
    group: 'surfaces',
    format: 'hsl',
    derived: true,
    description: '→ neutral-950',
  },
  {
    key: 'popover',
    label: 'Popover',
    group: 'surfaces',
    format: 'hsl',
    derived: true,
    description: '→ neutral-0 / neutral-200',
  },
  {
    key: 'popover-foreground',
    label: 'Popover foreground',
    group: 'surfaces',
    format: 'hsl',
    derived: true,
    description: '→ neutral-950',
  },
  {
    key: 'secondary',
    label: 'Secondary',
    group: 'surfaces',
    format: 'hsl',
    derived: true,
    description: '→ neutral-100 / neutral-400',
  },
  {
    key: 'secondary-foreground',
    label: 'Secondary foreground',
    group: 'surfaces',
    format: 'hsl',
    derived: true,
    description: '→ neutral-950',
  },
  {
    key: 'muted',
    label: 'Muted',
    group: 'surfaces',
    format: 'hsl',
    derived: true,
    description: '→ neutral-100 / neutral-300',
  },
  {
    key: 'muted-foreground',
    label: 'Muted foreground',
    group: 'surfaces',
    format: 'hsl',
    derived: true,
    description: '→ neutral-600 / neutral-800',
  },
  {
    key: 'highlight',
    label: 'Highlight',
    group: 'surfaces',
    format: 'hsl',
    description: 'Subtle emphasis — blue tint (light), neutral-500 (dark)',
  },
  {
    key: 'highlight-foreground',
    label: 'Highlight foreground',
    group: 'surfaces',
    format: 'hsl',
    derived: true,
    description: '→ neutral-950',
  },

  // Borders
  {
    key: 'border',
    label: 'Border',
    group: 'borders',
    format: 'hsl',
    derived: true,
    description: '→ neutral-300 / neutral-600',
  },
  {
    key: 'input',
    label: 'Input border/fill base',
    group: 'borders',
    format: 'hsl',
    derived: true,
    description: '→ neutral-300 / neutral-600',
  },

  // Brand
  {
    key: 'primary',
    label: 'Primary',
    group: 'brand',
    format: 'hsl',
    derived: true,
    description: '→ neutral-900 (near-black button)',
  },
  {
    key: 'primary-foreground',
    label: 'Primary foreground',
    group: 'brand',
    format: 'hsl',
    derived: true,
    description: '→ neutral-50 / neutral-50',
  },
  {
    key: 'cta',
    label: 'Main color (CTA)',
    group: 'brand',
    format: 'oklch',
    description: 'Brand violet — primary actions, nav active',
  },
  { key: 'cta-foreground', label: 'Main color text', group: 'brand', format: 'hsl' },
  {
    key: 'accent',
    label: 'Accent tint',
    group: 'brand',
    format: 'oklch',
    description: 'Light violet backgrounds',
  },
  {
    key: 'accent-foreground',
    label: 'Accent foreground',
    group: 'brand',
    format: 'hsl',
    derived: true,
    description: '→ neutral-950',
  },
  {
    key: 'ring',
    label: 'Focus ring',
    group: 'brand',
    format: 'oklch',
    description: 'Matches main color hue',
  },

  // State / categorical
  { key: 'destructive', label: 'Destructive / error', group: 'semantic', format: 'hsl' },
  { key: 'destructive-foreground', label: 'Destructive text', group: 'semantic', format: 'hsl' },
  { key: 'success', label: 'Success', group: 'semantic', format: 'hsl' },
  { key: 'success-foreground', label: 'Success text', group: 'semantic', format: 'hsl' },
  { key: 'warning', label: 'Warning', group: 'semantic', format: 'hsl' },
  {
    key: 'warning-foreground',
    label: 'Warning foreground',
    group: 'semantic',
    format: 'hsl',
    derived: true,
    description: '→ neutral-950 / neutral-50',
  },
  { key: 'info', label: 'Info', group: 'semantic', format: 'hsl' },
  { key: 'info-foreground', label: 'Info text', group: 'semantic', format: 'hsl' },
  {
    key: 'teal',
    label: 'Teal',
    group: 'semantic',
    format: 'hsl',
    description: 'Calendar / charts',
  },
  { key: 'teal-foreground', label: 'Teal foreground', group: 'semantic', format: 'hsl' },
  { key: 'orange', label: 'Orange', group: 'semantic', format: 'hsl' },
  {
    key: 'orange-foreground',
    label: 'Orange foreground',
    group: 'semantic',
    format: 'hsl',
    derived: true,
    description: '→ neutral-50 (dark)',
  },

  // Shell / nav (background aliases card — only active-state colors are unique)
  {
    key: 'sidebar-background',
    label: 'Sidebar background',
    group: 'shell',
    format: 'hsl',
    derived: true,
    description: '→ card (use APP_SHELL_SURFACE_CLASS in code)',
  },
  {
    key: 'sidebar-foreground',
    label: 'Sidebar foreground',
    group: 'shell',
    format: 'hsl',
    derived: true,
    description: '→ card-foreground',
  },
  {
    key: 'sidebar-primary',
    label: 'Sidebar active',
    group: 'shell',
    format: 'oklch',
    description: 'Nav active — matches CTA hue',
  },
  { key: 'sidebar-primary-foreground', label: 'Sidebar active fg', group: 'shell', format: 'hsl' },
  {
    key: 'sidebar-accent',
    label: 'Sidebar accent fill',
    group: 'shell',
    format: 'hsl',
    derived: true,
    description: '→ neutral-200 / neutral-300',
  },
  {
    key: 'sidebar-accent-foreground',
    label: 'Sidebar accent fg',
    group: 'shell',
    format: 'hsl',
    derived: true,
    description: '→ neutral-950',
  },
  {
    key: 'sidebar-border',
    label: 'Sidebar border',
    group: 'shell',
    format: 'hsl',
    derived: true,
    description: '→ border',
  },
  { key: 'sidebar-ring', label: 'Sidebar ring', group: 'shell', format: 'oklch' },

  // Layout
  { key: 'radius', label: 'Radius (base)', group: 'radius', format: 'length' },
  { key: 'radius-card', label: 'Radius card', group: 'radius', format: 'length' },
  { key: 'radius-control', label: 'Radius control', group: 'radius', format: 'length' },
  { key: 'radius-badge', label: 'Radius badge', group: 'radius', format: 'length' },
  {
    key: 'shadow-card',
    label: 'Shadow card',
    group: 'shadows',
    format: 'shadow',
    description: 'none — cards are flat',
  },
  {
    key: 'shadow-elevated',
    label: 'Shadow elevated',
    group: 'shadows',
    format: 'shadow',
    description: 'Dialogs, popovers, flyouts',
  },
  { key: 'transition-base', label: 'Transition base', group: 'motion', format: 'time' },
  { key: 'transition-slow', label: 'Transition slow', group: 'motion', format: 'time' },
  { key: 'font-sans', label: 'Font sans', group: 'typography', format: 'font' },
  {
    key: 'font-serif',
    label: 'Font serif',
    group: 'typography',
    format: 'font',
    description: 'Document preview only',
  },
  { key: 'font-mono', label: 'Font mono', group: 'typography', format: 'font' },
];

export const DESIGN_TOKEN_KEYS = DESIGN_TOKENS.map((token) => token.key);

/** Sidebar sections — brand & state first; neutral/layout collapsed by default. */
export type EditableTokenSection = {
  id: string;
  label: string;
  description: string;
  groups: TokenGroup[];
  defaultOpen: boolean;
};

export const EDITABLE_TOKEN_SECTIONS: EditableTokenSection[] = [
  {
    id: 'brand',
    label: 'Brand & main color',
    description: 'CTA violet, accent, focus ring',
    groups: ['brand'],
    defaultOpen: true,
  },
  {
    id: 'semantic',
    label: 'State & info colors',
    description: 'Success, warning, info, error, calendar',
    groups: ['semantic'],
    defaultOpen: true,
  },
  {
    id: 'neutral',
    label: 'Neutral ramp',
    description: 'Grays — card, muted, border follow automatically',
    groups: ['neutral'],
    defaultOpen: false,
  },
  {
    id: 'surfaces',
    label: 'Emphasis',
    description: 'Highlight panels',
    groups: ['surfaces'],
    defaultOpen: false,
  },
  {
    id: 'shell',
    label: 'Navigation',
    description: 'Sidebar active state',
    groups: ['shell'],
    defaultOpen: false,
  },
  {
    id: 'layout',
    label: 'Layout & typography',
    description: 'Radius, shadows, motion, fonts',
    groups: ['radius', 'shadows', 'motion', 'typography'],
    defaultOpen: false,
  },
];

export function getTokensByGroup(group: TokenGroup): DesignToken[] {
  return DESIGN_TOKENS.filter((token) => token.group === group);
}

/** Tokens the playground can edit — excludes derived aliases (card, muted, border, …). */
export function getEditableTokens(): DesignToken[] {
  return DESIGN_TOKENS.filter((token) => !token.derived);
}

export function getEditableTokensBySection(): Array<
  EditableTokenSection & { tokens: DesignToken[] }
> {
  const editable = getEditableTokens();
  return EDITABLE_TOKEN_SECTIONS.map((section) => ({
    ...section,
    tokens: editable.filter((token) => section.groups.includes(token.group)),
  })).filter((section) => section.tokens.length > 0);
}

export function getTokenGroupLabel(group: TokenGroup): string {
  return TOKEN_GROUPS.find((entry) => entry.key === group)?.label ?? group;
}

export function getTokenByKey(key: string): DesignToken | undefined {
  return DESIGN_TOKENS.find((token) => token.key === key);
}

export function readTokenFromDom(key: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${key}`).trim();
}

/** Read the stylesheet default, ignoring inline overrides on documentElement. */
export function readBaseTokenFromStylesheet(key: string): string {
  const root = document.documentElement;
  const inline = root.style.getPropertyValue(`--${key}`);
  if (inline) root.style.removeProperty(`--${key}`);
  const value = readTokenFromDom(key);
  if (inline) root.style.setProperty(`--${key}`, inline);
  return value;
}
