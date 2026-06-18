import { useCallback, useEffect, useRef, useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { appToast } from '@/lib/toast';

import type { StorageNode } from './types';
import { useFileTextContent, useSaveTextFile, useStorageNode } from './useStorageData';

const AUTOSAVE_DELAY_MS = 1500;

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export function useDocumentEditorSession({
  nodeId,
  onNodeIdChange,
}: {
  nodeId: string | null;
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
  const markdownRef = useRef<string | null>(null);
  const nodeRef = useRef<StorageNode | null>(null);
  nodeRef.current = node;

  // Load text into local state once it arrives (and when switching files).
  // Skip while the user has unsaved edits or a save is in flight, so a refetch
  // triggered by the post-save node-id remap can't stomp in-progress keystrokes.
  useEffect(() => {
    if (contentQuery.data === undefined) return;
    if (dirtyRef.current || status === 'saving') return;
    setMarkdown(contentQuery.data);
    markdownRef.current = contentQuery.data;
    setStatus('idle');
  }, [contentQuery.data, status]);

  const flush = useCallback(async (): Promise<string | null> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const activeNode = nodeRef.current;
    const current = markdownRef.current;
    if (!activeNode) return null;
    if (!dirtyRef.current || current === null) return activeNode.id;
    setStatus('saving');
    try {
      const saved = await saveMutation.mutateAsync({ node: activeNode, markdown: current });
      dirtyRef.current = false;
      setStatus('saved');
      if (saved.id !== activeNode.id) onNodeIdChange(saved.id);
      return saved.id;
    } catch (error) {
      setStatus('error');
      appToast.fromApiError(error, t('storage.editor.saveFailed'));
      return activeNode.id;
    }
  }, [onNodeIdChange, saveMutation, t]);

  const handleChange = useCallback(
    (next: string) => {
      setMarkdown(next);
      markdownRef.current = next;
      dirtyRef.current = true;
      setStatus('dirty');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    },
    [flush],
  );

  // Cancel any pending autosave if the consumer unmounts.
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

  return {
    node,
    markdown,
    status,
    statusLabel,
    handleChange,
    flush,
    isLoading: contentQuery.isLoading || markdown === null,
    error: contentQuery.error,
  };
}
