import { useEffect, useMemo, useState } from 'react';

import { SplitView } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import {
  PageHeaderCtaButton,
  PageHeaderOutlineButton,
} from '@/components/common/PageHeaderButtons';
import { EmailIcon, PlusIcon, TemplatesIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import {
  buildForwardDraft,
  buildReplyDraft,
  EmailComposerDialog,
  EmailTemplatesDialog,
  EmailThreadDetail,
  EmailThreadQueue,
  queueEmailSend,
  type ComposerMode,
  type EmailDraft,
  type EmailTemplate,
} from '@/components/email';
import { getWindowStorage } from '@/lib/storage/safeStorage';

import { EMAIL_CONTACT_OPTIONS, EMAIL_FOLDERS, EMAIL_TEMPLATES, EMAIL_THREADS } from './demoData';
import { resolveLinkedEntityHref } from './emailLinkedEntityRoutes';
import { loadStoredEmailThreads, storeEmailThreads } from './emailStorage';
import { emailPageIcon } from './shared';
const EMPTY_DRAFT: EmailDraft = {
  to: [],
  cc: [],
  subject: '',
  bodyHtml: '<p></p>',
  attachments: [],
};

export function EmailPage() {
  const storage = getWindowStorage('localStorage');
  const [threads, setThreads] = useState(() => loadStoredEmailThreads(storage, EMAIL_THREADS));
  const [activeThreadId, setActiveThreadId] = useState(EMAIL_THREADS[0]?.id ?? '');
  const [draft, setDraft] = useState<EmailDraft>(EMPTY_DRAFT);
  const [composerMode, setComposerMode] = useState<ComposerMode>('closed');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string>('inbox');

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? threads[0],
    [activeThreadId, threads],
  );

  const closeComposer = () => {
    setComposerMode('closed');
    setDraft(EMPTY_DRAFT);
  };

  const openComposer = (mode: Exclude<ComposerMode, 'closed'>) => {
    if (!activeThread && mode !== 'new') return;
    setComposerMode(mode);
    if (mode === 'reply') setDraft(buildReplyDraft(activeThread, false));
    else if (mode === 'replyAll') setDraft(buildReplyDraft(activeThread, true));
    else if (mode === 'forward') setDraft(buildForwardDraft(activeThread));
    else setDraft(EMPTY_DRAFT);
  };

  useEffect(() => {
    if (composerMode !== 'closed') closeComposer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId]);

  useEffect(() => {
    storeEmailThreads(storage, threads);
  }, [threads, storage]);

  const applyTemplate = (template: EmailTemplate) => {
    setDraft((current) => ({
      ...current,
      templateId: template.id,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
    }));
  };

  const startNewDraft = () => {
    setComposerMode('new');
    setDraft(EMPTY_DRAFT);
  };

  const useTemplate = (template: EmailTemplate) => {
    setComposerMode('new');
    setDraft({
      ...EMPTY_DRAFT,
      templateId: template.id,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
    });
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setSelectedFromList = (ids: string[]) => setSelectedIds(new Set(ids));

  const removeThreads = (ids: string[]) => {
    setThreads((prev) => prev.filter((t) => !ids.includes(t.id)));
    setSelectedIds(new Set());
    if (ids.includes(activeThreadId)) {
      const next = threads.find((t) => !ids.includes(t.id));
      setActiveThreadId(next?.id ?? '');
    }
  };

  const moveThreadsToFolder = (ids: string[], folderId: string) => {
    setThreads((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, folderId } : t)));
    setSelectedIds(new Set());
    if (ids.includes(activeThreadId)) {
      const remaining = threads.filter((t) => t.folderId === activeFolderId && !ids.includes(t.id));
      setActiveThreadId(remaining[0]?.id ?? '');
    }
  };

  const mapStatus = (ids: string[], status: 'Unread' | 'Linked') => {
    setThreads((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, status } : t)));
  };

  const handleArchive = (ids: string[]) => {
    if (ids.length === 0) return;
    // In Papierkorb already → hard delete; otherwise move to archive.
    const inTrash = ids.every((id) => threads.find((t) => t.id === id)?.folderId === 'trash');
    if (inTrash) {
      removeThreads(ids);
    } else {
      moveThreadsToFolder(ids, 'archive');
    }
    appToast.success(`${ids.length} thread${ids.length === 1 ? '' : 's'} archived.`);
  };

  const handleDelete = (ids: string[]) => {
    if (ids.length === 0) return;
    const inTrash = ids.every((id) => threads.find((t) => t.id === id)?.folderId === 'trash');
    if (inTrash) {
      removeThreads(ids);
    } else {
      moveThreadsToFolder(ids, 'trash');
    }
    appToast.success(`${ids.length} thread${ids.length === 1 ? '' : 's'} deleted.`);
  };

  const handleFolderChange = (folderId: string) => {
    setActiveFolderId(folderId);
    setSelectedIds(new Set());
    const first = threads.find((t) => t.folderId === folderId);
    setActiveThreadId(first?.id ?? '');
  };

  const handleMarkRead = (ids: string[]) => {
    if (ids.length === 0) return;
    mapStatus(ids, 'Linked');
    setSelectedIds(new Set());
  };

  const handleMarkUnread = (ids: string[]) => {
    if (ids.length === 0) return;
    mapStatus(ids, 'Unread');
    setSelectedIds(new Set());
  };

  const handleFlag = (ids: string[]) => {
    if (ids.length === 0) return;
    appToast.success(`${ids.length} thread${ids.length === 1 ? '' : 's'} flagged.`);
  };

  const sendDraft = () => {
    if (!activeThread) return;
    try {
      const result = queueEmailSend({
        threads,
        threadId: activeThread.id,
        draft,
        sentAt: new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date()),
      });
      setThreads(result.threads);
      setDraft(EMPTY_DRAFT);
      setComposerMode('closed');
      appToast.success('Email queued for sending.');
    } catch (error) {
      appToast.fromApiError(error, 'Email could not be sent.');
    }
  };

  return (
    <ModulePage
      fillHeight
      title="Email"
      subtitle="Mailbox workbench, templates, composer, and linked record context"
      icon={emailPageIcon()}
      actions={
        <>
          <PageHeaderOutlineButton type="button" onClick={() => setTemplatesDialogOpen(true)}>
            <TemplatesIcon size={14} />
            Templates
          </PageHeaderOutlineButton>
          <PageHeaderCtaButton type="button" onClick={startNewDraft}>
            <PlusIcon size={14} />
            Compose
          </PageHeaderCtaButton>
        </>
      }
    >
      <SplitView
        persistKey="email-workbench-split"
        defaultSidebarWidth={360}
        minSidebarWidth={320}
        maxSidebarWidth={440}
        className="min-h-0 flex-1 w-full"
        sidebarScroll={false}
        sidebarClassName="min-h-0 overflow-hidden"
        sidebar={
          <EmailThreadQueue
            threads={threads}
            folders={EMAIL_FOLDERS}
            activeFolderId={activeFolderId}
            onFolderChange={handleFolderChange}
            activeId={activeThread?.id ?? ''}
            selectedIds={selectedIds}
            onSelect={setActiveThreadId}
            onToggleSelect={toggleSelectId}
            onSetSelected={setSelectedFromList}
            onBulkArchive={handleArchive}
            onBulkDelete={handleDelete}
            onBulkMarkRead={handleMarkRead}
            onBulkMarkUnread={handleMarkUnread}
          />
        }
      >
        {activeThread ? (
          <EmailThreadDetail
            thread={activeThread}
            resolveHref={resolveLinkedEntityHref}
            onOpenComposer={openComposer}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onMarkUnread={handleMarkUnread}
            onFlag={handleFlag}
          />
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
            <EmailIcon size={16} className="mr-2" />
            No thread selected.
          </div>
        )}
      </SplitView>
      <EmailComposerDialog
        mode={composerMode}
        draft={draft}
        templates={EMAIL_TEMPLATES}
        contactOptions={EMAIL_CONTACT_OPTIONS}
        onDraftChange={setDraft}
        onApplyTemplate={applyTemplate}
        onSend={sendDraft}
        onClose={closeComposer}
        attachments={draft.attachments ?? []}
        onAttachmentsChange={(attachments) => setDraft({ ...draft, attachments })}
      />
      <EmailTemplatesDialog
        open={templatesDialogOpen}
        templates={EMAIL_TEMPLATES}
        onOpenChange={setTemplatesDialogOpen}
        onUseTemplate={useTemplate}
      />
    </ModulePage>
  );
}
