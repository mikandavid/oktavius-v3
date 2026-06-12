import { AttachmentList, Button, cn, Combobox, Input, RichTextEditor } from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import { RecipientCombobox } from '@/components/forms/RecipientCombobox';
import { CloseIcon, PaperclipIcon, SendIcon } from '@/lib/icons';

import type { EmailAttachment, EmailDraft, EmailTemplate } from './types';

export type EmailContactOption = { value: string; label: string; description?: string };

type EmailComposerProps = {
  draft: EmailDraft;
  templates: EmailTemplate[];
  onChange: (draft: EmailDraft) => void;
  onApplyTemplate: (template: EmailTemplate) => void;
  onSend: () => void;
  onDiscard?: () => void;
  attachments?: EmailAttachment[];
  onAttachmentsChange?: (attachments: EmailAttachment[]) => void;
  /** Suggested recipients (address book); selected addresses are always included. */
  contactOptions?: EmailContactOption[];
  sendDisabled?: boolean;
  /** When embedded inside a dialog or other framed surface, drop outer border/bg and the Send/Discard row. */
  embedded?: boolean;
};

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="w-10 shrink-0 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

function buildRecipientOptions(selected: string[], contactOptions: EmailContactOption[]) {
  const merged = new Map<string, EmailContactOption>();
  contactOptions.forEach((entry) => merged.set(entry.value, entry));
  selected.forEach((value) => {
    if (!merged.has(value)) merged.set(value, { value, label: value });
  });
  return Array.from(merged.values());
}

export function EmailComposer({
  draft,
  templates,
  onChange,
  onApplyTemplate,
  onSend,
  onDiscard,
  attachments = [],
  onAttachmentsChange,
  contactOptions = [],
  sendDisabled = false,
  embedded = false,
}: EmailComposerProps) {
  const [ccVisible, setCcVisible] = useState(draft.cc.length > 0);
  const [bccVisible, setBccVisible] = useState(false);
  const [bcc, setBcc] = useState<string[]>([]);

  const toOptions = useMemo(
    () => buildRecipientOptions(draft.to, contactOptions),
    [contactOptions, draft.to],
  );
  const ccOptions = useMemo(
    () => buildRecipientOptions(draft.cc, contactOptions),
    [contactOptions, draft.cc],
  );
  const bccOptions = useMemo(
    () => buildRecipientOptions(bcc, contactOptions),
    [bcc, contactOptions],
  );

  const handleAttach = () => {
    if (!onAttachmentsChange) return;
    const id = `att_${Date.now()}`;
    onAttachmentsChange([
      ...attachments,
      { id, name: `attachment-${attachments.length + 1}.pdf`, size: 128_000 },
    ]);
  };

  const removeAttachment = (id: string) => {
    if (!onAttachmentsChange) return;
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  };

  return (
    <div className={embedded ? '' : 'rounded-card border border-border/60 bg-card'}>
      <div className="space-y-2 px-3 pt-3">
        <div className="flex items-center gap-2">
          <FieldLabel>To</FieldLabel>
          <div className="min-w-0 flex-1">
            <RecipientCombobox
              value={draft.to}
              options={toOptions}
              onChange={(to) => onChange({ ...draft, to })}
              placeholder="Add recipient"
            />
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {!ccVisible ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[11px]"
                onClick={() => setCcVisible(true)}
              >
                Cc
              </Button>
            ) : null}
            {!bccVisible ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[11px]"
                onClick={() => setBccVisible(true)}
              >
                Bcc
              </Button>
            ) : null}
          </div>
        </div>

        {ccVisible ? (
          <div className="flex items-center gap-2">
            <FieldLabel>Cc</FieldLabel>
            <div className="min-w-0 flex-1">
              <RecipientCombobox
                value={draft.cc}
                options={ccOptions}
                onChange={(cc) => onChange({ ...draft, cc })}
                placeholder="Add Cc"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 shrink-0 p-0"
              onClick={() => {
                setCcVisible(false);
                onChange({ ...draft, cc: [] });
              }}
              aria-label="Remove Cc"
            >
              <CloseIcon size={12} />
            </Button>
          </div>
        ) : null}

        {bccVisible ? (
          <div className="flex items-center gap-2">
            <FieldLabel>Bcc</FieldLabel>
            <div className="min-w-0 flex-1">
              <RecipientCombobox
                value={bcc}
                options={bccOptions}
                onChange={setBcc}
                placeholder="Add Bcc"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 shrink-0 p-0"
              onClick={() => {
                setBccVisible(false);
                setBcc([]);
              }}
              aria-label="Remove Bcc"
            >
              <CloseIcon size={12} />
            </Button>
          </div>
        ) : null}

        <div className="flex items-center gap-2 border-t border-border/40 pt-1.5">
          <FieldLabel>Subj</FieldLabel>
          <Input
            value={draft.subject}
            onChange={(event) => onChange({ ...draft, subject: event.target.value })}
            placeholder="Subject"
            className="h-7 flex-1 border-0 px-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="border-t border-border/40 px-3 py-3">
        <RichTextEditor
          value={draft.bodyHtml}
          onChange={(bodyHtml) => onChange({ ...draft, bodyHtml })}
          placeholder="Write a message…"
          toolbar="email"
          minHeightClassName="min-h-[8rem]"
          aria-label="Email body"
        />
      </div>

      {attachments.length > 0 ? (
        <div className={cn('space-y-1 border-t border-border/40 px-3 py-2')}>
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <PaperclipIcon size={11} />
            {attachments.length} attachment{attachments.length === 1 ? '' : 's'}
          </p>
          <AttachmentList
            attachments={attachments.map((a) => ({ id: a.id, name: a.name, size: a.size }))}
            onDelete={removeAttachment}
          />
        </div>
      ) : null}

      {!embedded ? (
        <div className="flex items-center justify-between gap-2 border-t border-border/40 px-3 py-2">
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
                options={templates.map((template) => ({
                  value: template.id,
                  label: template.name,
                  description: template.description,
                }))}
                placeholder="Template"
                onChange={(id) => {
                  const template = templates.find((entry) => entry.id === id);
                  if (template) onApplyTemplate(template);
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onDiscard ? (
              <Button type="button" size="sm" variant="ghost" onClick={onDiscard}>
                Discard
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="cta" onClick={onSend} disabled={sendDisabled}>
              <SendIcon size={13} />
              Send
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
