import { cn, MarkdownEditor } from '@oktavius/base-ui';
import { useEffect, useState } from 'react';

import { MODULE_PAGE_FILL_CLASS } from '@/components/common/pageChrome';
import { useRegisterFillHeightPage } from '@/components/layout/AppShellLayoutContext';
import { useTranslation } from '@/core/i18n';
import { BackIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import { isEditableTextFile } from '../data/textFiles';
import { useDocumentEditorSession } from '../data/useDocumentEditorSession';
import { useStorageMutations } from '../data/useStorageData';

export function StorageDocumentEditorPage({
  nodeId,
  onClose,
  onNodeIdChange,
}: {
  nodeId: string;
  onClose: () => void;
  onNodeIdChange: (id: string) => void;
}) {
  const { t } = useTranslation();
  useRegisterFillHeightPage(true);

  const { node, markdown, statusLabel, handleChange, isLoading, error } = useDocumentEditorSession({
    nodeId,
    onNodeIdChange,
  });
  const { rename } = useStorageMutations();
  const [title, setTitle] = useState('');

  // Keep the title input in sync with the loaded/renamed node.
  useEffect(() => {
    if (node) setTitle(node.name);
  }, [node?.id, node?.name]);

  // Bounce back to the grid if the doc param points at a non-editable node.
  useEffect(() => {
    if (node && !isEditableTextFile(node)) onClose();
  }, [node, onClose]);

  const commitTitle = () => {
    const next = title.trim();
    if (!node || !next || next === node.name) {
      if (node) setTitle(node.name);
      return;
    }
    rename.mutate(
      { id: node.id, name: next },
      { onError: (err) => appToast.fromApiError(err, t('storage.editor.saveFailed')) },
    );
  };

  return (
    <div
      className={cn(MODULE_PAGE_FILL_CLASS, 'min-w-0 max-w-full')}
      data-testid="storage-document-editor"
    >
      <header className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          data-testid="editor-back"
          aria-label={t('storage.editor.backToStorage')}
          className="flex h-9 w-9 items-center justify-center rounded-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          onClick={onClose}
        >
          <BackIcon size={18} />
        </button>
        <input
          aria-label={t('storage.editor.titleLabel')}
          className="min-w-0 flex-1 truncate bg-transparent text-base font-semibold text-foreground outline-none focus:rounded-card focus:bg-muted/40 focus:px-2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={commitTitle}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape' && node) {
              setTitle(node.name);
              event.currentTarget.blur();
            }
          }}
        />
        <span className="shrink-0 text-xs text-muted-foreground" data-testid="save-status">
          {statusLabel}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain rounded-card bg-muted/30 px-4 py-8 [scrollbar-gutter:stable]">
        {isLoading ? (
          <p className="mx-auto max-w-[816px] text-sm text-muted-foreground">
            {t('storage.editor.loading')}
          </p>
        ) : error ? (
          <p className="mx-auto max-w-[816px] text-sm text-destructive">
            {t('storage.editor.loadFailed')}
          </p>
        ) : (
          <div className="mx-auto w-full max-w-[816px] rounded-card bg-card px-10 py-12 shadow-sm md:px-14">
            <MarkdownEditor
              value={markdown ?? ''}
              onChange={handleChange}
              aria-label={node?.name}
              minHeightClassName="min-h-[55vh]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
