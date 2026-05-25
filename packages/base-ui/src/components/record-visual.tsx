import type { ReactNode } from 'react';

import { CARD_CONTENT_TIERS } from './detail-field';
import { cn } from '../lib/utils';

/** Fixed visual sizes — pair with typography tiers, never ad-hoc dimensions. */
export type RecordVisualSize = 'sm' | 'md' | 'lg' | 'xl';

const VISUAL_SIZE_CLASS: Record<RecordVisualSize, string> = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
  xl: 'h-14 w-14',
};

const ICON_SIZE_CLASS: Record<RecordVisualSize, string> = {
  sm: '[&_svg]:size-3.5',
  md: '[&_svg]:size-4',
  lg: '[&_svg]:size-5',
  xl: '[&_svg]:size-6',
};

function IconShell({
  icon,
  size,
  className,
  label,
}: {
  icon: ReactNode;
  size: RecordVisualSize;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-control bg-muted/50 text-muted-foreground',
        ICON_SIZE_CLASS[size],
        VISUAL_SIZE_CLASS[size],
        className,
      )}
      aria-label={label}
    >
      {icon}
    </div>
  );
}

export type RecordVisualProps =
  | {
      kind: 'image';
      src: string;
      alt: string;
      size?: RecordVisualSize;
      className?: string;
    }
  | {
      kind: 'avatar';
      /** Accessible name for the record */
      label: string;
      src?: string | null;
      /** Required when `src` is absent — entity/module icon, never initials */
      icon: ReactNode;
      size?: RecordVisualSize;
      className?: string;
    }
  | {
      kind: 'icon';
      icon: ReactNode;
      size?: RecordVisualSize;
      className?: string;
    };

/**
 * Unified record visual — logo, photo, or module icon.
 * Use at the left of cards and rows so users recognize the record before reading text.
 */
export function RecordVisual(props: RecordVisualProps) {
  const size = props.size ?? 'md';
  const shell = cn('shrink-0', VISUAL_SIZE_CLASS[size], props.className);

  if (props.kind === 'avatar') {
    if (props.src) {
      return (
        <div
          className={cn('overflow-hidden rounded-full bg-muted/40 ring-1 ring-border/40', shell)}
          aria-label={props.label}
        >
          <img src={props.src} alt="" className="h-full w-full object-cover" />
        </div>
      );
    }

    return (
      <IconShell icon={props.icon} size={size} className={props.className} label={props.label} />
    );
  }

  if (props.kind === 'image') {
    return (
      <div
        className={cn('overflow-hidden rounded-control bg-muted/40 ring-1 ring-border/40', shell)}
      >
        <img src={props.src} alt={props.alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return <IconShell icon={props.icon} size={size} className={props.className} />;
}

export type RecordIdentityProps = {
  visual: RecordVisualProps;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Tier-6 footnote — record id, external ref */
  meta?: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

/**
 * Card identity band — visual anchor + hero title. Place at the top of record cards
 * (detail panels, queue items, order summaries) before field grids.
 */
export function RecordIdentity({
  visual,
  title,
  subtitle,
  meta,
  trailing,
  className,
}: RecordIdentityProps) {
  return (
    <div className={cn('flex items-start gap-4', className)}>
      <RecordVisual {...visual} size={visual.size ?? 'lg'} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className={cn(CARD_CONTENT_TIERS.hero, 'truncate')}>{title}</p>
        {subtitle ? <p className={cn(CARD_CONTENT_TIERS.meta, 'truncate')}>{subtitle}</p> : null}
        {meta ? <p className={cn(CARD_CONTENT_TIERS.micro, 'truncate')}>{meta}</p> : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
