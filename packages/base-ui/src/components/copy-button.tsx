import * as React from 'react';

import { Check, Copy } from '@phosphor-icons/react';

import { cn } from '../lib/utils';
import { Button, type ButtonProps } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

export interface CopyButtonProps extends Omit<ButtonProps, 'children' | 'onClick' | 'value' | 'aria-label'> {
  /** Text to write to clipboard. */
  value: string;
  /** Optional visible label. Without it, renders icon-only. */
  children?: React.ReactNode;
  label?: string;
  /** Duration of "copied" state in ms. */
  durationMs?: number;
}

/**
 * Clipboard copy button. Icon-only by default; pass `children` to add a label.
 * Shows a tooltip and flips to a check icon on success.
 */
export function CopyButton({
  value,
  children,
  label = 'Copy',
  durationMs = 1500,
  variant = 'ghost',
  size,
  className,
  disabled,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const iconOnly = !children;
  const finalSize = size ?? (iconOnly ? 'icon' : 'sm');

  React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), durationMs);
    } catch {
      // clipboard not available
    }
  };

  const icon = copied ? (
    <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
  ) : (
    <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
  );

  const button = (
    <Button
      type="button"
      variant={variant}
      size={finalSize}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      className={cn(iconOnly && 'h-7 w-7', !iconOnly && 'gap-1.5', className)}
      {...props}
    >
      {icon}
      {children}
    </Button>
  );

  if (!iconOnly) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{copied ? 'Copied!' : label}</TooltipContent>
    </Tooltip>
  );
}
