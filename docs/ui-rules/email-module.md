# Email module

## Pattern

Email is a queue/detail workflow, not a tabbed module.

```tsx
<ModulePage fillHeight title="Email" icon={emailPageIcon()}>
  <SplitView
    persistKey="email-workbench-split"
    defaultSidebarWidth={420}
    minSidebarWidth={340}
    maxSidebarWidth={760}
    sidebar={<EmailThreadQueue />}
  >
    <EmailThreadDetail />
  </SplitView>
</ModulePage>
```

## Composer

- Composer is **hidden by default** below the message list. Reveal via the action bar — `Reply`, `Reply all`, `Forward` buttons (Outlook/Gmail style). Never render the composer as a permanent block under every thread.
- Composer mode lives in page state (`ComposerMode = 'closed' | 'reply' | 'replyAll' | 'forward' | 'new'`). Switching threads closes the composer and discards draft.
- Reply/forward prefill comes from `buildReplyDraft` / `buildForwardDraft` in `emailActions.ts` (subject `Re:`/`Fwd:` prefix, quoted body, recipients).
- Use `RichTextEditor` from `@oktavius/base-ui`; it wraps Tiptap and is reusable outside email.
- Keep the toolbar compact: bold, italic, strike, lists, quote, undo, redo.
- Use `RecipientCombobox` for To/Cc/Bcc recipients.
- Attachments use existing document/storage components.
- Templates are applied through a compact picker or combobox; do not build a drag-drop template editor for v1.

## Detail

- Header: subject, account, linked entity, status.
- Messages render chronologically as stacked message blocks.
- Related client/case/invoice appears as a linked pill, not as another nav layer.
- Do not hide Inbox/Sent/Drafts behind top tabs; use queue filters later if needed.
