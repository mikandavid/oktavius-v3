import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

/**
 * Six fixed content tiers for card interiors. Every value inside a card maps to
 * exactly one tier — never mix ad-hoc font sizes. Prevents spreadsheet-style grids
 * where every field looks equally important.
 */
export const CARD_CONTENT_TIERS = {
  /** Tier 1 — record identity, primary metric (one per card region) */
  hero: 'text-xl font-semibold leading-tight tracking-tight text-foreground',
  /** Tier 2 — important values that deserve emphasis with an icon */
  highlight: 'text-base font-semibold leading-snug text-foreground',
  /** Tier 3 — default field values, row titles */
  body: 'text-sm text-foreground',
  /** Tier 4 — field labels (sentence case, never uppercase) */
  label: 'text-xs font-medium text-muted-foreground',
  /** Tier 5 — secondary context, subtitles, timestamps */
  meta: 'text-xs text-muted-foreground',
  /** Tier 6 — IDs, codes, technical footnotes */
  micro: 'font-mono text-[11px] leading-snug text-muted-foreground/80',
} as const;

export type DetailFieldImportance = 'primary' | 'default' | 'meta';

export type DetailFieldProps = {
  key?: string;
  label: string;
  value: ReactNode;
  section?: string;
  colSpan?: 1 | 2;
  /** Drives typography tier and layout region inside the card */
  importance?: DetailFieldImportance;
  /** Shown beside primary fields — use for status, type, contact channel, etc. */
  icon?: ReactNode;
};

const VALUE_TIER_CLASS: Record<DetailFieldImportance, string> = {
  primary: CARD_CONTENT_TIERS.highlight,
  default: CARD_CONTENT_TIERS.body,
  meta: CARD_CONTENT_TIERS.meta,
};

function DetailFieldItem({
  field,
  importance = 'default',
}: {
  field: DetailFieldProps;
  importance?: DetailFieldImportance;
}) {
  const tier = field.importance ?? importance;
  const valueClass =
    tier === 'primary'
      ? CARD_CONTENT_TIERS.highlight
      : tier === 'meta'
        ? CARD_CONTENT_TIERS.meta
        : VALUE_TIER_CLASS.default;

  return (
    <div className={field.colSpan === 2 ? 'space-y-1 md:col-span-2' : 'space-y-1'}>
      <dt className={CARD_CONTENT_TIERS.label}>{field.label}</dt>
      <dd className={valueClass}>{field.value}</dd>
    </div>
  );
}

/** Primary record facts — large values with optional iconography. Max 6 items. */
export function RecordInfoHero({
  fields,
  className,
}: {
  fields: DetailFieldProps[];
  className?: string;
}) {
  if (fields.length === 0) return null;

  const items = fields.slice(0, 6);

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map((field, index) => (
        <div
          key={field.key ?? `${field.label}-${index}`}
          className="flex min-w-0 items-start gap-3"
        >
          {field.icon ? (
            <div className="mt-0.5 shrink-0 text-muted-foreground/70 [&_svg]:size-5">
              {field.icon}
            </div>
          ) : null}
          <div className="min-w-0 space-y-0.5">
            <p className={CARD_CONTENT_TIERS.label}>{field.label}</p>
            <p className={CARD_CONTENT_TIERS.hero}>{field.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Compact footer strip for low-priority metadata (IDs, audit fields). Max 6 items. */
export function RecordInfoMeta({ fields }: { fields: DetailFieldProps[] }) {
  if (fields.length === 0) return null;

  const items = fields.slice(0, 6);

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border/50 pt-3">
      {items.map((field, index) => (
        <span
          key={field.key ?? `${field.label}-${index}`}
          className="inline-flex min-w-0 max-w-full items-baseline gap-1.5"
        >
          <span className={cn(CARD_CONTENT_TIERS.label, 'shrink-0')}>{field.label}</span>
          <span className={cn(CARD_CONTENT_TIERS.micro, 'truncate')}>{field.value}</span>
        </span>
      ))}
    </div>
  );
}

/** Standard two-column field grid for default-importance fields. */
export function DetailFieldGrid({
  fields,
  className,
}: {
  fields: DetailFieldProps[];
  className?: string;
}) {
  if (fields.length === 0) return null;

  return (
    <dl className={cn('grid gap-4 md:grid-cols-2', className)}>
      {fields.map((field, index) => (
        <DetailFieldItem
          key={field.key ?? `${field.label}-${index}`}
          field={field}
          importance="default"
        />
      ))}
    </dl>
  );
}
