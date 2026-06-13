import { cn } from '@oktavius/base-ui';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { SpinnerIcon, UploadIcon, WarningIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import { uploadFile } from '../data/uploadFile';
import { useInvalidateStorage, useStorageClient } from '../data/useStorageData';

interface QueueItem {
  id: string;
  name: string;
  status: 'uploading' | 'done' | 'failed';
}

export function StorageUploadLayer({
  folderId,
  children,
}: {
  folderId: string | null;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const client = useStorageClient();
  const invalidate = useInvalidateStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const counter = useRef(0);

  async function runUploads(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const id = `u${(counter.current += 1)}`;
      setQueue((items) => [...items, { id, name: file.name, status: 'uploading' }]);
      try {
        const { duplicateOfNodeId } = await uploadFile(client, file, folderId);
        setQueue((items) =>
          items.map((item) => (item.id === id ? { ...item, status: 'done' } : item)),
        );
        if (duplicateOfNodeId) {
          appToast.info(t('storage.upload.duplicate', { name: file.name }));
        }
      } catch (error) {
        setQueue((items) =>
          items.map((item) => (item.id === id ? { ...item, status: 'failed' } : item)),
        );
        appToast.fromApiError(error, t('storage.upload.failed', { name: file.name }));
      }
    }
    invalidate();
    setTimeout(
      () => setQueue((items) => items.filter((item) => item.status === 'uploading')),
      2500,
    );
  }

  useEffect(() => {
    const open = () => fileInputRef.current?.click();
    document.addEventListener('storage:upload', open);
    return () => document.removeEventListener('storage:upload', open);
  }, []);

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (event.dataTransfer.files.length) void runUploads(event.dataTransfer.files);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) void runUploads(event.target.files);
          event.target.value = '';
        }}
      />
      {children}

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-card border-2 border-dashed border-cta bg-cta/5">
          <div className="flex items-center gap-2 text-sm font-medium text-cta">
            <UploadIcon size={20} /> {t('storage.upload.dropHere')}
          </div>
        </div>
      )}

      {queue.length > 0 && (
        <div className="absolute bottom-4 right-4 z-20 w-72 rounded-card bg-card p-3 shadow-elevated">
          {queue.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-1 text-sm">
              {item.status === 'uploading' && (
                <SpinnerIcon size={16} className="animate-spin text-cta" />
              )}
              {item.status === 'failed' && <WarningIcon size={16} className="text-destructive" />}
              {item.status === 'done' && <UploadIcon size={16} className="text-success" />}
              <span className={cn('truncate', item.status === 'failed' && 'text-destructive')}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
