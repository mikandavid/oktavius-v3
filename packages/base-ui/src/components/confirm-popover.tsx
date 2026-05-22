import * as React from 'react';

import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface ConfirmPopoverProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `destructive` for delete; `cta` for non-destructive confirms in a popover. */
  confirmVariant?: 'destructive' | 'cta';
  onConfirm: () => void;
  /** The element that opens the popover. */
  trigger: React.ReactNode;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Lightweight inline confirm for destructive actions.
 * Use when a full modal dialog is too disruptive (e.g. row-level deletes).
 */
export function ConfirmPopover({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'destructive',
  onConfirm,
  trigger,
  disabled = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ConfirmPopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    controlledOnOpenChange?.(next);
  };

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-64 p-3">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{title}</p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              {cancelLabel}
            </Button>
            <Button type="button" size="sm" variant={confirmVariant} onClick={handleConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
