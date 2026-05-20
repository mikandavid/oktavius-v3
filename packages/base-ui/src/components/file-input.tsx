import * as React from 'react';

import { cn } from '../lib/utils';

export interface FileInputProps {
  value?: File | null;
  onChange?: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

/**
 * Styled file picker with drag-and-drop zone.
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
}: FileInputProps) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onChange?.(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={cn(
        'relative flex min-h-[5rem] cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed transition-colors',
        dragging
          ? 'border-primary bg-primary/5'
          : 'border-border/60 bg-background hover:border-border/80 hover:bg-muted/20',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value ? (
        <div className="flex w-full items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground text-xs font-medium">
            {value.name.split('.').pop()?.toUpperCase() ?? 'FILE'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{value.name}</p>
            <p className="text-xs text-muted-foreground">
              {(value.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange?.(null); }}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Remove file"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 text-center">
          <p className="text-sm text-muted-foreground">{placeholder}</p>
          {accept ? (
            <p className="mt-0.5 text-xs text-muted-foreground/70">{accept}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
