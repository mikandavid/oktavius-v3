import { Dialog, DialogContent, DialogTitle, MarkdownEditor } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { CloseIcon, ExpandIcon } from '@/lib/icons';

import { useDocumentEditorSession } from '../data/useDocumentEditorSession';

export function StorageDocumentEditorModal({
  nodeId,
  onClose,
  onNodeIdChange,
  onOpenFullPage,
}: {
  nodeId: string | null;
  onClose: () => void;
  onNodeIdChange: (id: string) => void;
  onOpenFullPage?: (nodeId: string) => void;
}) {
  const { t } = useTranslation();
  const { node, markdown, statusLabel, handleChange, flush, isLoading, error } =
    useDocumentEditorSession({ nodeId, onNodeIdChange });

  const handleClose = () => {
    void flush();
    onClose();
  };

  const handleOpenFullPage = async () => {
    const id = await flush();
    if (id) onOpenFullPage?.(id);
  };

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
          {onOpenFullPage ? (
            <button
              type="button"
              data-testid="editor-open-full-page"
              aria-label={t('storage.editor.openFullPage')}
              className="text-muted-foreground hover:text-foreground"
              onClick={() => void handleOpenFullPage()}
            >
              <ExpandIcon size={18} />
            </button>
          ) : null}
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

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('storage.editor.loading')}</p>
        ) : error ? (
          <p className="text-sm text-destructive">{t('storage.editor.loadFailed')}</p>
        ) : (
          <MarkdownEditor
            value={markdown ?? ''}
            onChange={handleChange}
            aria-label={node?.name}
            className="min-h-0 flex-1"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
