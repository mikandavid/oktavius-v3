import { cn } from '@oktavius/base-ui';
import type { ReactNode } from 'react';

type ContentPanelProps = {
  title?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function ContentPanel({ title, open, onClose, children, className }: ContentPanelProps) {
  if (!open) return null;

  return (
    <div className={cn('fixed inset-0 z-50 flex justify-end bg-black/20', className)}>
      <button type="button" className="flex-1" aria-label="Close panel" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">{title ?? 'Details'}</h3>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
