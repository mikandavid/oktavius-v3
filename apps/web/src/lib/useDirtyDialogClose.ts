import { useCallback, useState } from 'react';

const DEFAULT_MESSAGE =
  'You have unsaved changes. If you close this dialog, your changes will be lost.';

/** Confirms (via in-app dialog) before closing a dialog when an embedded form is dirty. */
export function useDirtyDialogClose(
  onOpenChange: (open: boolean) => void,
  message = DEFAULT_MESSAGE,
) {
  const [isDirty, setIsDirty] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next && isDirty) {
        setPendingClose(true);
        return;
      }
      onOpenChange(next);
    },
    [isDirty, onOpenChange],
  );

  const requestClose = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  const confirmDiscard = useCallback(() => {
    setPendingClose(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const cancelDiscard = useCallback(() => {
    setPendingClose(false);
  }, []);

  return {
    handleOpenChange,
    requestClose,
    onDirtyChange: setIsDirty,
    isDirty,
    pendingClose,
    confirmDiscard,
    cancelDiscard,
    discardMessage: message,
  };
}
