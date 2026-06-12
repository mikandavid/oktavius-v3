import { cn } from '@oktavius/base-ui';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { ArrowUpIcon, SquareIcon } from '@/lib/icons';

type ChatComposerProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  onPaste?: React.ClipboardEventHandler<HTMLTextAreaElement>;
  isLoading: boolean;
  disabled?: boolean;
  submitDisabled?: boolean;
  placeholder: string;
  stopAriaLabel?: string;
  leftControls?: React.ReactNode;
  rightControls?: React.ReactNode;
  bottomControls?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  maxHeight?: number;
  singleLineHeight?: number;
};

const DEFAULT_MAX_HEIGHT = 88;
const DEFAULT_SINGLE_LINE_HEIGHT = 32;

export function ChatComposer({
  value,
  onValueChange,
  onSubmit,
  onStop,
  onPaste,
  isLoading,
  disabled = false,
  submitDisabled = false,
  placeholder,
  stopAriaLabel = 'Stop generation',
  leftControls,
  rightControls,
  bottomControls,
  className,
  inputClassName,
  textareaRef,
  maxHeight = DEFAULT_MAX_HEIGHT,
  singleLineHeight = DEFAULT_SINGLE_LINE_HEIGHT,
}: ChatComposerProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const resolvedRef = textareaRef ?? internalRef;
  const [isMultiline, setIsMultiline] = useState(false);

  const resize = useCallback(() => {
    const input = resolvedRef.current;
    if (!input) return;
    input.style.height = '0px';
    const nextHeight = Math.min(input.scrollHeight, maxHeight);
    input.style.height = `${nextHeight}px`;
    input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
    setIsMultiline(input.scrollHeight > singleLineHeight);
  }, [maxHeight, resolvedRef, singleLineHeight]);

  useEffect(() => {
    resize();
  }, [resize, value]);

  return (
    <div
      className={cn(
        'rounded-[20px] border border-border bg-background px-1.5 py-1.5 transition-colors duration-150 focus-within:border-primary/30',
        className,
      )}
    >
      <div className={cn('flex min-w-0', isMultiline ? 'items-start' : 'items-center')}>
        {leftControls ? (
          <div className={cn('flex shrink-0 items-center gap-0.5', isMultiline && 'self-start')}>
            {leftControls}
          </div>
        ) : null}
        <textarea
          ref={resolvedRef}
          rows={1}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onPaste={onPaste}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'min-h-7 h-7 min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-1 text-sm leading-5 shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
            inputClassName,
          )}
        />
        {rightControls ? (
          <div className={cn('flex shrink-0 items-center gap-0.5', isMultiline && 'self-start')}>
            {rightControls}
          </div>
        ) : null}
        {isLoading ? (
          <button
            type="button"
            onClick={() => onStop?.()}
            tabIndex={-1}
            aria-label={stopAriaLabel}
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90',
              isMultiline && 'self-start',
            )}
          >
            <SquareIcon size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled}
            tabIndex={-1}
            aria-label="Send message"
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cta text-cta-foreground transition-colors hover:bg-cta/90 disabled:opacity-40',
              submitDisabled && 'disabled:pointer-events-none',
              isMultiline && 'self-start',
            )}
          >
            <ArrowUpIcon size={14} weight="bold" />
          </button>
        )}
      </div>
      {bottomControls ? (
        <div className="mt-1 flex items-center gap-1.5 px-0.5 pt-0.5">{bottomControls}</div>
      ) : null}
    </div>
  );
}
