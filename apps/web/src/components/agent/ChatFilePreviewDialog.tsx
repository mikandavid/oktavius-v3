import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@oktavius/base-ui';

import { DocumentPreview } from '@/components/documents/DocumentPreview';

import { formatFileSize, getAttachmentIcon } from './agentHelpers';

type ChatFilePreviewDialogProps = {
  file: File;
  onClose: () => void;
};

export function ChatFilePreviewDialog({ file, onClose }: ChatFilePreviewDialogProps) {
  const Icon = getAttachmentIcon(file.name, file.type);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex h-[90vh] max-h-[95vh] w-full max-w-[95vw] flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Icon size={20} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{file.name}</span>
            <span className="ml-auto shrink-0 text-xs font-normal text-muted-foreground">
              {formatFileSize(file.size)}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <DocumentPreview
            document={{
              name: file.name,
              mimeType: file.type,
              file,
            }}
            className="h-full rounded-none border-0"
            bodyClassName="h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
