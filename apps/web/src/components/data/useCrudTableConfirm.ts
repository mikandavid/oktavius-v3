import { useCallback, useMemo, useState } from 'react';

import type { BulkAction, CrudRowAction } from './crudTableTypes';

type ConfirmDialogState<T> =
  | { mode: 'row'; action: CrudRowAction<T>; item: T }
  | { mode: 'bulk'; action: BulkAction; ids: string[] }
  | null;

/** Confirm-before-invoke flow shared by row actions, bulk actions and the mobile list. */
export function useCrudTableConfirm<T>() {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState<T>>(null);

  const invokeBulkAction = useCallback((action: BulkAction, ids: string[]) => {
    if (action.confirm) {
      setConfirmDialog({ mode: 'bulk', action, ids });
      return;
    }
    void action.onClick(ids);
  }, []);

  const invokeRowAction = useCallback((action: CrudRowAction<T>, item: T) => {
    if (action.confirm) {
      setConfirmDialog({ mode: 'row', action, item });
      return;
    }
    void action.onClick(item);
  }, []);

  const crudConfirm = useMemo(() => {
    if (!confirmDialog) return null;
    const confirm = confirmDialog.action.confirm;
    if (!confirm) return null;
    const { action } = confirmDialog;
    const title: string =
      confirmDialog.mode === 'bulk' && typeof confirm.title === 'function'
        ? confirm.title(confirmDialog.ids.length)
        : String(confirm.title);

    return {
      title,
      description: confirm.description,
      confirmLabel: confirm.actionLabel ?? (confirmDialog.mode === 'bulk' ? 'Delete' : 'Confirm'),
      confirmVariant: (action.destructive ? 'destructive' : 'cta') as 'destructive' | 'cta',
      onConfirm: () => {
        if (confirmDialog.mode === 'row') {
          void confirmDialog.action.onClick(confirmDialog.item);
        } else {
          void confirmDialog.action.onClick(confirmDialog.ids);
        }
        setConfirmDialog(null);
      },
    };
  }, [confirmDialog]);

  return { confirmDialog, setConfirmDialog, invokeBulkAction, invokeRowAction, crudConfirm };
}
