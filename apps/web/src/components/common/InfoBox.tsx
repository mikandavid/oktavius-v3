import type { ReactNode } from 'react';

import { cn, getSemanticToneClasses, type SemanticTone } from '@oktavius/base-ui';

type InfoBoxTone = Extract<
  SemanticTone,
  'neutral' | 'info' | 'success' | 'warning' | 'destructive'
>;

type InfoBoxProps = {
  tone?: InfoBoxTone;
  icon?: ReactNode;
  title?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function InfoBox({ tone = 'neutral', icon, title, className, children }: InfoBoxProps) {
  return (
    <div
      className={cn(
        'rounded-card border p-4',
        getSemanticToneClasses(tone, 'softEmphasis'),
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
        <div className="min-w-0 space-y-1.5">
          {title ? <p className="text-sm font-medium">{title}</p> : null}
          {children ? <div className="text-sm text-foreground/90">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
