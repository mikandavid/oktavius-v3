import { ConfirmActionDialog } from './ConfirmActionDialog';

type DiscardChangesDialogProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
};

/** Standard "you have unsaved changes" confirm — replaces window.confirm. Built on ConfirmActionDialog (AlertDialog). */
export function DiscardChangesDialog({
  open,
  onConfirm,
  onCancel,
  title = 'Discard changes?',
  description = 'You have unsaved changes. If you continue, your changes will be lost.',
  confirmLabel = 'Discard',
}: DiscardChangesDialogProps) {
  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel="Keep editing"
      confirmVariant="destructive"
      onConfirm={onConfirm}
    />
  );
}
