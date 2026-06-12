import { cn } from '@oktavius/base-ui';
import type { DragEvent, ReactNode } from 'react';

import { UploadIcon } from '@/lib/icons';

type PageFileDropProps = {
  onFiles: (files: File[]) => void;
  accept?: string;
  children?: ReactNode;
  className?: string;
};

export function PageFileDrop({ onFiles, accept, children, className }: PageFileDropProps) {
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  };

  return (
    <div
      className={cn(
        'rounded-card border border-dashed border-border/70 bg-muted/10 p-4 transition-colors hover:border-primary/40',
        className,
      )}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      {children ?? (
        <label className="flex cursor-pointer flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
          <UploadIcon size={20} />
          <span>Drop files here or click to browse</span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) onFiles(files);
              event.target.value = '';
            }}
          />
        </label>
      )}
    </div>
  );
}
