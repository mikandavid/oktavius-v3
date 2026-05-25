/**
 * Central semantic color palette — single source for tone-based Tailwind classes.
 * All components (Badge, AlertBanner, StatusDot, Timeline, calendar fills) should
 * use these helpers instead of inline tone mappings.
 */

export type SemanticTone =
  | 'neutral'
  | 'primary'
  | 'cta'
  | 'info'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'highlight'
  | 'teal'
  | 'orange';

export type SemanticToneVariant =
  /** Container fill — border + bg, body text stays foreground */
  | 'soft'
  /** Container fill + tone-colored text (badges, info boxes) */
  | 'softEmphasis'
  /** Solid fill with contrasting foreground */
  | 'solid'
  /** Small indicator dot */
  | 'dot'
  /** Faint dot (presence, inactive) */
  | 'dotMuted'
  /** Text color only */
  | 'text'
  /** Ring-style marker (timeline dots) */
  | 'ring';

interface ToneClasses {
  soft: string;
  softEmphasis: string;
  solid: string;
  dot: string;
  dotMuted: string;
  text: string;
  ring: string;
}

const SEMANTIC_TONE_CLASSES: Record<SemanticTone, ToneClasses> = {
  neutral: {
    soft: 'border-border bg-muted/40',
    softEmphasis: 'border-border bg-muted/40 text-foreground',
    solid: 'bg-muted text-foreground',
    dot: 'bg-muted-foreground',
    dotMuted: 'bg-muted-foreground/40',
    text: 'text-muted-foreground',
    ring: 'bg-border border-border/60',
  },
  primary: {
    soft: 'border-primary/20 bg-primary/10',
    softEmphasis: 'border-primary/20 bg-primary/10 text-primary',
    solid: 'bg-primary text-primary-foreground',
    dot: 'bg-primary',
    dotMuted: 'bg-primary/40',
    text: 'text-primary',
    ring: 'bg-primary border-primary/30',
  },
  cta: {
    soft: 'border-cta/20 bg-cta/10',
    softEmphasis: 'border-cta/20 bg-cta/10 text-cta',
    solid: 'bg-cta text-cta-foreground hover:brightness-95',
    dot: 'bg-cta',
    dotMuted: 'bg-cta/40',
    text: 'text-cta',
    ring: 'bg-cta border-cta/30',
  },
  info: {
    soft: 'border-info/20 bg-info/10',
    softEmphasis: 'border-info/20 bg-info/10 text-info',
    solid: 'bg-info text-info-foreground hover:brightness-95',
    dot: 'bg-info',
    dotMuted: 'bg-info/40',
    text: 'text-info',
    ring: 'bg-info border-info/30',
  },
  success: {
    soft: 'border-success/20 bg-success/10',
    softEmphasis: 'border-success/20 bg-success/10 text-success',
    solid: 'bg-success text-success-foreground hover:brightness-95',
    dot: 'bg-success',
    dotMuted: 'bg-success/40',
    text: 'text-success',
    ring: 'bg-success border-success/30',
  },
  warning: {
    soft: 'border-warning/20 bg-warning/10',
    softEmphasis: 'border-warning/20 bg-warning/10 text-warning',
    solid: 'bg-warning text-warning-foreground hover:brightness-95',
    dot: 'bg-warning',
    dotMuted: 'bg-warning/40',
    text: 'text-warning',
    ring: 'bg-warning border-warning/30',
  },
  destructive: {
    soft: 'border-destructive/20 bg-destructive/10',
    softEmphasis: 'border-destructive/20 bg-destructive/10 text-destructive',
    solid: 'bg-destructive text-destructive-foreground hover:brightness-95',
    dot: 'bg-destructive',
    dotMuted: 'bg-destructive/40',
    text: 'text-destructive',
    ring: 'bg-destructive border-destructive/30',
  },
  highlight: {
    soft: 'border-border/80 bg-highlight',
    softEmphasis: 'border-border/80 bg-highlight text-highlight-foreground',
    solid: 'bg-highlight text-highlight-foreground',
    dot: 'bg-highlight-foreground',
    dotMuted: 'bg-highlight-foreground/40',
    text: 'text-highlight-foreground',
    ring: 'bg-highlight border-border/60',
  },
  teal: {
    soft: 'border-teal/20 bg-teal/10',
    softEmphasis: 'border-teal/20 bg-teal/10 text-teal',
    solid: 'bg-teal text-teal-foreground hover:brightness-95',
    dot: 'bg-teal',
    dotMuted: 'bg-teal/40',
    text: 'text-teal',
    ring: 'bg-teal border-teal/30',
  },
  orange: {
    soft: 'border-orange/20 bg-orange/10',
    softEmphasis: 'border-orange/20 bg-orange/10 text-orange',
    solid: 'bg-orange text-orange-foreground hover:brightness-95',
    dot: 'bg-orange',
    dotMuted: 'bg-orange/40',
    text: 'text-orange',
    ring: 'bg-orange border-orange/30',
  },
};

/** Default ordering for repeated categorical color assignment (charts, avatars, tags). */
export const DEFAULT_SEMANTIC_TONE_ORDER: readonly SemanticTone[] = [
  'info',
  'success',
  'warning',
  'cta',
  'teal',
  'orange',
  'highlight',
  'neutral',
];

export function getSemanticToneClasses(tone: SemanticTone, variant: SemanticToneVariant): string {
  return SEMANTIC_TONE_CLASSES[tone][variant];
}

export function hashStringToIndex(seed: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % modulo;
}

export function pickSemanticToneBySeed(seed: string): SemanticTone {
  return DEFAULT_SEMANTIC_TONE_ORDER[hashStringToIndex(seed, DEFAULT_SEMANTIC_TONE_ORDER.length)];
}

/** Map legacy StatusDot tone names to palette tones. */
export function resolveStatusDotTone(
  tone: 'neutral' | 'success' | 'info' | 'warning' | 'destructive' | 'muted',
): { tone: SemanticTone; variant: 'dot' | 'dotMuted' } {
  if (tone === 'muted') return { tone: 'neutral', variant: 'dotMuted' };
  return { tone, variant: 'dot' };
}
