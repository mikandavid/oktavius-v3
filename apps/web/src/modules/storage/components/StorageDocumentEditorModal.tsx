import { Dialog, DialogContent, DialogTitle, MarkdownEditor } from '@oktavius/base-ui';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { CloseIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import { useFileTextContent, useSaveTextFile, useStorageNode } from '../data/useStorageData';

const AUTOSAVE_DELAY_MS = 1500;

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export function StorageDocumentEditorModal({
  nodeId,
  onClose,
  onNodeIdChange,
}: {
  nodeId: string | null;
  onClose: () => void;
  onNodeIdChange: (id: string) => void;
}) {
  const { t } = useTranslation();
  const nodeQuery = useStorageNode(nodeId);
  const node = nodeQuery.data ?? null;
  const contentQuery = useFileTextContent(node);
  const saveMutation = useSaveTextFile();

  const [markdown, setMarkdown] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  // Load text into local state once it arrives (and when switching files).
  useEffect(() => {
    if (contentQuery.data !== undefined) {
      setMarkdown(contentQuery.data);
      setStatus('idle');
      dirtyRef.current = false;
    }
  }, [contentQuery.data]);

  const flush = async (current: string) => {
    if (!node || !dirtyRef.current) return;
    setStatus('saving');
    try {
      const saved = await saveMutation.mutateAsync({ node, markdown: current });
      dirtyRef.current = false;
      setStatus('saved');
      if (saved.id !== node.id) onNodeIdChange(saved.id);
    } catch (error) {
      setStatus('error');
      appToast.fromApiError(error, t('storage.editor.saveFailed'));
    }
  };

  const handleChange = (next: string) => {
    setMarkdown(next);
    dirtyRef.current = true;
    setStatus('dirty');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flush(next), AUTOSAVE_DELAY_MS);
  };

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (dirtyRef.current && markdown !== null) void flush(markdown);
    onClose();
  };

  // Cancel any pending autosave if the modal unmounts without going through handleClose.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  // Warn before unloading the tab while a save is pending (native beforeunload is
  // the only permitted native dialog).
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current || status === 'saving') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status]);

  const statusLabel =
    status === 'saving'
      ? t('storage.editor.saving')
      : status === 'saved'
        ? t('storage.editor.saved')
        : status === 'dirty'
          ? t('storage.editor.unsaved')
          : status === 'error'
            ? t('storage.editor.saveFailed')
            : '';

  return (
    <Dialog open={Boolean(nodeId)} onOpenChange={(value) => (!value ? handleClose() : undefined)}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[85vh] w-[85vw] max-w-[900px] flex-col gap-3 p-6"
      >
        <div className="flex items-center gap-3">
          <DialogTitle className="min-w-0 flex-1 truncate text-sm">{node?.name ?? ''}</DialogTitle>
          <span className="text-xs text-muted-foreground" data-testid="save-status">
            {statusLabel}
          </span>
          <button
            type="button"
            data-testid="editor-close"
            aria-label={t('storage.editor.close')}
            className="text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {contentQuery.isLoading || markdown === null ? (
          <p className="text-sm text-muted-foreground">{t('storage.editor.loading')}</p>
        ) : contentQuery.error ? (
          <p className="text-sm text-destructive">{t('storage.editor.loadFailed')}</p>
        ) : (
          <MarkdownEditor
            value={markdown}
            onChange={handleChange}
            aria-label={node?.name}
            className="min-h-0 flex-1"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
