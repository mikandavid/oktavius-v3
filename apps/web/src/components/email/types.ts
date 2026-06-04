export type EmailThreadStatus = 'Unread' | 'Linked' | 'Draft' | 'Failed' | 'Sent';

/** Well-known mailbox roles. Custom folders use string ids beyond these. */
export type EmailFolderKind = 'inbox' | 'sent' | 'drafts' | 'archive' | 'spam' | 'trash' | 'custom';

export type EmailFolder = {
  id: string;
  label: string;
  kind: EmailFolderKind;
};

export type EmailAttachment = {
  id: string;
  name: string;
  size: number;
};

export type EmailMessage = {
  id: string;
  direction: 'inbound' | 'outbound';
  from: string;
  to: string[];
  cc?: string[];
  sentAt: string;
  bodyHtml: string;
  attachments?: EmailAttachment[];
};

export type EmailThread = {
  id: string;
  subject: string;
  preview: string;
  participants: string[];
  updatedAt: string;
  account: string;
  status: EmailThreadStatus;
  folderId: string;
  linkedEntity?: {
    label: string;
    href: string;
  };
  messages: EmailMessage[];
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  description: string;
  bodyHtml: string;
  updatedAt: string;
};

export type EmailDraft = {
  to: string[];
  cc: string[];
  subject: string;
  bodyHtml: string;
  templateId?: string;
  attachments?: EmailAttachment[];
};
