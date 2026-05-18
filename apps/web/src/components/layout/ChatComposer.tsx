import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import { Textarea, cn } from '@oktavius/base-ui';

import { ForwardIcon, StopIcon } from '@/lib/icons';

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
  leftControls?: React.ReactNode;
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
  leftControls,
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
        'flex rounded-[20px] border border-border bg-background py-1.5 pl-1.5 pr-1.5 transition-colors duration-150 focus-within:border-primary/30',
        isMultiline ? 'items-start' : 'items-center',
        className,
      )}
    >
      {leftControls ? (
        <div className={cn('flex shrink-0 items-center gap-0.5', isMultiline && 'self-start')}>
          {leftControls}
        </div>
      ) : null}
      <Textarea
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
          'min-h-7 h-7 flex-1 resize-none border-0 bg-transparent px-2 py-1 text-sm leading-5 shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0',
          inputClassName,
        )}
      />
      {isLoading ? (
        <button
          type="button"
          onClick={() => onStop?.()}
          tabIndex={-1}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90',
            isMultiline && 'self-start',
          )}
        >
          <StopIcon size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          tabIndex={-1}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-30',
            isMultiline && 'self-start',
          )}
        >
          <ForwardIcon size={14} />
        </button>
      )}
    </div>
  );
}
