import { useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { cn } from '../lib/utils';

export interface FileInputProps {
  value?: File | null;
  onChange?: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  maxSize?: number;
}

/**
 * Styled file picker with drag-and-drop zone (react-dropzone).
 * Emits `File | null` — calling code handles upload on form submit.
 */
export function FileInput({
  value,
  onChange,
  accept,
  disabled = false,
  placeholder = 'Drop a file or click to browse',
  className,
  id,
  maxSize,
}: FileInputProps) {
  const [rejectMessage, setRejectMessage] = useState<string | null>(null);

  const acceptMap = useMemo(() => {
    if (!accept) return undefined;
    return Object.fromEntries(
      accept
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => [entry, [] as string[]]),
    );
  }, [accept]);

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } = useDropzone({
    accept: acceptMap,
    disabled,
    maxFiles: 1,
    maxSize,
    multiple: false,
    noClick: true,
    noKeyboard: false,
    onDropAccepted: (files) => {
      setRejectMessage(null);
      onChange?.(files[0] ?? null);
    },
    onDropRejected: (rejections) => {
      const first = rejections[0]?.errors[0];
      setRejectMessage(first?.message ?? 'File could not be accepted.');
    },
  });

  return (
    <div
      {...getRootProps({
        id,
        className: cn(
          'relative flex min-h-[5rem] cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed transition-colors',
          isDragActive && !isDragReject
            ? 'border-primary bg-primary/5'
            : 'border-border/60 bg-background hover:border-border/80 hover:bg-muted/20',
          (isDragReject || rejectMessage) && 'border-destructive/60 bg-destructive/5',
          disabled && 'pointer-events-none opacity-50',
          className,
        ),
        onClick: () => {
          if (!disabled) open();
        },
      })}
    >
      <input {...getInputProps()} />

      {value ? (
        <div className="flex w-full items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
            {value.name.split('.').pop()?.toUpperCase() ?? 'FILE'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{value.name}</p>
            <p className="text-xs text-muted-foreground">{(value.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setRejectMessage(null);
              onChange?.(null);
            }}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Remove file"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 text-center">
          <p className="text-sm text-muted-foreground">{placeholder}</p>
          {accept ? <p className="mt-0.5 text-xs text-muted-foreground/70">{accept}</p> : null}
          {rejectMessage ? <p className="mt-1 text-xs text-destructive">{rejectMessage}</p> : null}
        </div>
      )}
    </div>
  );
}
