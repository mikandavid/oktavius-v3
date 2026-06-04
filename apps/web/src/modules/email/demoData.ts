import type { EmailFolder, EmailTemplate, EmailThread } from '@/components/email';

/**
 * Demo mailbox folders. In production this list is hydrated from the connected
 * email account (IMAP folders / Gmail labels). System kinds drive default
 * behaviour (archive/trash targets); arbitrary custom folders are also allowed.
 */
export const EMAIL_FOLDERS: EmailFolder[] = [
  { id: 'inbox', label: 'Posteingang', kind: 'inbox' },
  { id: 'sent', label: 'Gesendet', kind: 'sent' },
  { id: 'drafts', label: 'Entwürfe', kind: 'drafts' },
  { id: 'archive', label: 'Archiv', kind: 'archive' },
  { id: 'spam', label: 'Spam', kind: 'spam' },
  { id: 'trash', label: 'Papierkorb', kind: 'trash' },
];

export const EMAIL_CONTACT_OPTIONS = [
  { value: 'anna.hofer@apex.at', label: 'Anna Hofer', description: 'anna.hofer@apex.at' },
  { value: 'finance@apex.at', label: 'Finance team', description: 'finance@apex.at' },
  {
    value: 'ops@donau-logistics.test',
    label: 'Donau Logistics',
    description: 'ops@donau-logistics.test',
  },
  { value: 'eva@bruckner.test', label: 'Eva Bruckner', description: 'eva@bruckner.test' },
  { value: 'office@kunz.at', label: 'Bestattung Kunz', description: 'office@kunz.at' },
];

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl_follow_up',
    name: 'Client follow-up',
    subject: 'Follow-up for {{client.name}}',
    description: 'Short post-meeting recap with next actions.',
    updatedAt: 'Updated 27.05.2026',
    bodyHtml:
      '<p>Hello,</p><p>thank you for the conversation. I summarized the next steps below.</p><ul><li>Confirm the requested documents</li><li>Review the proposed timeline</li><li>Reply with any missing details</li></ul><p>Best regards</p>',
  },
  {
    id: 'tpl_invoice',
    name: 'Invoice handoff',
    subject: 'Invoice {{invoice.number}}',
    description: 'Send invoice and payment context.',
    updatedAt: 'Updated 22.05.2026',
    bodyHtml:
      '<p>Hello,</p><p>attached is invoice {{invoice.number}} for your records.</p><p>Please let us know if anything needs to be corrected.</p>',
  },
  {
    id: 'tpl_case_update',
    name: 'Case status update',
    subject: 'Status update for {{case.number}}',
    description: 'Operational update for active case stakeholders.',
    updatedAt: 'Updated 14.05.2026',
    bodyHtml:
      '<p>Hello,</p><p>we have updated the case status. The current stage is {{case.stage}}.</p><p>Open items are listed in Oktavius.</p>',
  },
];

export const EMAIL_THREADS: EmailThread[] = [
  {
    id: 'eml_1001',
    folderId: 'inbox',
    subject: 'Contract approval and installation dates',
    preview: 'Can you confirm whether the updated contract can be signed this week?',
    participants: ['Eva Bruckner', 'Markus Leitner'],
    updatedAt: '10:42',
    account: 'markus.leitner@osiris.test',
    status: 'Unread',
    linkedEntity: { label: 'Contract C-2048', href: '/email' },
    messages: [
      {
        id: 'msg_1',
        direction: 'inbound',
        from: 'eva@bruckner.test',
        to: ['markus.leitner@osiris.test'],
        sentAt: 'Today, 10:42',
        bodyHtml:
          '<p>Hi Markus,</p><p>Can you confirm whether the updated contract can be signed this week? We would like to align the installation dates before Friday.</p>',
      },
      {
        id: 'msg_2',
        direction: 'outbound',
        from: 'markus.leitner@osiris.test',
        to: ['eva@bruckner.test'],
        sentAt: 'Today, 10:58',
        bodyHtml:
          '<p>Hi Eva,</p><p>I am checking the final clause with legal and will come back with a clear answer this afternoon.</p>',
      },
    ],
  },
  {
    id: 'eml_1002',
    folderId: 'inbox',
    subject: 'Invoice INV-2026-018 payment confirmation',
    preview: 'Payment was sent this morning. Please match it against the open invoice.',
    participants: ['Finance team', 'Apex Technologies'],
    updatedAt: 'Yesterday',
    account: 'finance@apex.at',
    status: 'Linked',
    linkedEntity: { label: 'Invoice INV-2026-018', href: '/email' },
    messages: [
      {
        id: 'msg_3',
        direction: 'inbound',
        from: 'finance@apex.at',
        to: ['accounting@oktavius.test'],
        sentAt: 'Yesterday, 16:18',
        bodyHtml:
          '<p>Payment was sent this morning. Please match it against the open invoice and send us the receipt.</p>',
        attachments: [{ id: 'att_1', name: 'payment-confirmation.pdf', size: 86016 }],
      },
    ],
  },
  {
    id: 'eml_1003',
    folderId: 'drafts',
    subject: 'Draft: Welcome package',
    preview: 'Draft prepared by the agent, waiting for review.',
    participants: ['Anna Hofer'],
    updatedAt: 'Mon',
    account: 'anna.hofer@apex.at',
    status: 'Draft',
    linkedEntity: { label: 'Client Apex Technologies', href: '/email' },
    messages: [
      {
        id: 'msg_4',
        direction: 'outbound',
        from: 'anna.hofer@apex.at',
        to: ['contact@apex-tech.test'],
        sentAt: 'Draft',
        bodyHtml:
          '<p>Hello,</p><p>attached is the welcome package for your Oktavius workspace. Please review the onboarding checklist before our kickoff.</p>',
        attachments: [{ id: 'att_2', name: 'welcome-package.pdf', size: 319488 }],
      },
    ],
  },
  {
    id: 'eml_1004',
    folderId: 'sent',
    subject: 'Delivery failed: municipal notification',
    preview: 'Recipient rejected the message because the mailbox is full.',
    participants: ['Municipal office'],
    updatedAt: 'Fri',
    account: 'office@kunz.at',
    status: 'Failed',
    linkedEntity: { label: 'Sterbefall SF-2026-004', href: '/email' },
    messages: [
      {
        id: 'msg_5',
        direction: 'outbound',
        from: 'office@kunz.at',
        to: ['friedhof@pitten.gv.at'],
        sentAt: 'Friday, 09:12',
        bodyHtml: '<p>Attached are the current documents for the municipal notification.</p>',
        attachments: [{ id: 'att_3', name: 'notification-documents.zip', size: 1153434 }],
      },
    ],
  },
];
