import { useCallback, useState } from 'react';

const DEFAULT_MESSAGE = 'You have unsaved changes. Close this dialog anyway?';

/** Confirms before closing a dialog when an embedded form is dirty. */
export function useDirtyDialogClose(
  onOpenChange: (open: boolean) => void,
  message = DEFAULT_MESSAGE,
) {
  const [isDirty, setIsDirty] = useState(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next && isDirty) {
        if (!window.confirm(message)) return;
      }
      onOpenChange(next);
    },
    [isDirty, message, onOpenChange],
  );

  const requestClose = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  return {
    handleOpenChange,
    requestClose,
    onDirtyChange: setIsDirty,
    isDirty,
  };
}
