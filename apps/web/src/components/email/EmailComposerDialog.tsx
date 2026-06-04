import {
  Button,
  Combobox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@oktavius/base-ui';

import { PaperclipIcon } from '@/lib/icons';

import { EmailComposer, type EmailContactOption } from './EmailComposer';
import type { ComposerMode } from './emailActions';
import type { EmailAttachment, EmailDraft, EmailTemplate } from './types';

const MODE_TITLE: Record<Exclude<ComposerMode, 'closed'>, string> = {
  reply: 'Reply',
  replyAll: 'Reply all',
  forward: 'Forward',
  new: 'New message',
};

export type EmailComposerDialogProps = {
  mode: ComposerMode;
  draft: EmailDraft;
  templates: EmailTemplate[];
  onDraftChange: (draft: EmailDraft) => void;
  onApplyTemplate: (template: EmailTemplate) => void;
  onSend: () => void;
  onClose: () => void;
  attachments?: EmailAttachment[];
  onAttachmentsChange?: (attachments: EmailAttachment[]) => void;
  contactOptions?: EmailContactOption[];
};

/**
 * Standardized composer surface — centered modal used for reply, reply all,
 * forward, and new message. Unified footer keeps attachment/template controls
 * and Discard/Send in one row.
 */
export function EmailComposerDialog({
  mode,
  draft,
  templates,
  onDraftChange,
  onApplyTemplate,
  onSend,
  onClose,
  attachments,
  onAttachmentsChange,
  contactOptions,
}: EmailComposerDialogProps) {
  const open = mode !== 'closed';
  const title = open ? MODE_TITLE[mode as Exclude<ComposerMode, 'closed'>] : '';

  const handleAttach = () => {
    if (!onAttachmentsChange) return;
    const id = `att_${Date.now()}`;
    onAttachmentsChange([
      ...(attachments ?? []),
      { id, name: `attachment-${(attachments?.length ?? 0) + 1}.pdf`, size: 128_000 },
    ]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-0 border-0 p-5 pb-0">
        <DialogHeader className="pb-3">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EmailComposer
            embedded
            draft={draft}
            templates={templates}
            contactOptions={contactOptions}
            onChange={onDraftChange}
            onApplyTemplate={onApplyTemplate}
            onSend={onSend}
            attachments={attachments ?? []}
            onAttachmentsChange={onAttachmentsChange}
            sendDisabled={draft.to.length === 0}
          />
        </div>
        <DialogFooter className="border-t border-border/40 py-3 sm:justify-between">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleAttach}
              aria-label="Attach file"
            >
              <PaperclipIcon size={14} />
            </Button>
            <div className="w-44">
              <Combobox
                value={draft.templateId ?? ''}
                options={templates.map((t) => ({
                  value: t.id,
                  label: t.name,
                  description: t.description,
                }))}
                placeholder="Template"
                onChange={(id) => {
                  const template = templates.find((t) => t.id === id);
                  if (template) onApplyTemplate(template);
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Discard
            </Button>
            <Button type="button" variant="cta" onClick={onSend} disabled={draft.to.length === 0}>
              Send
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
