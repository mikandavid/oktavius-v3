import { useState } from 'react';

import { AttachmentList, Button, type Attachment } from '@oktavius/base-ui';

import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { DocumentGenerateDialog } from '@/components/documents/DocumentGenerateDialog';
import { DocumentPreviewPanel } from '@/components/documents/DocumentPreviewPanel';
import {
  DOCUMENT_PREVIEW_DEMO_FILES,
  DOCUMENT_PREVIEW_DEMO_PDF_URL,
} from '@/components/documents/documentPreviewDemoData';
import { PdfPreviewPanel } from '@/components/documents/PdfPreviewPanel';
import { DocumentSendDialog } from '@/components/documents/DocumentSendDialog';
import { EmailTemplatePicker } from '@/components/documents/EmailTemplatePicker';
import { TemplatePicker } from '@/components/documents/TemplatePicker';
import { appToast } from '@/lib/toast';

import { ShowcaseBlock } from '../shared';

const DEMO_TEMPLATES = [
  {
    id: 'tpl_1',
    name: 'Standard invoice',
    description: 'Default invoice layout with line items',
    category: 'Invoices',
    updatedAt: '2024-11-01',
  },
  {
    id: 'tpl_2',
    name: 'Service agreement',
    description: 'Master service agreement PDF',
    category: 'Contracts',
    updatedAt: '2024-10-15',
  },
];

const DEMO_EMAIL_TEMPLATES = [
  {
    id: 'em_1',
    name: 'Invoice sent',
    subject: 'Your invoice from Oktavius',
    description: 'Notify client when invoice is issued',
  },
  {
    id: 'em_2',
    name: 'Contract renewal',
    subject: 'Contract renewal reminder',
    description: '60-day renewal notice',
  },
];

const INITIAL_ATTACHMENTS: Attachment[] = [
  {
    id: 'att_1',
    name: 'contract_signed.pdf',
    size: 248000,
    mimeType: 'application/pdf',
    uploadedAt: '2024-04-02',
    uploadedBy: 'Anna Hofer',
  },
  {
    id: 'att_2',
    name: 'invoice_march.xlsx',
    size: 64000,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedAt: '2024-03-28',
    uploadedBy: 'Markus Leitner',
  },
];
export function DocumentsSection() {
  const [attachments, setAttachments] = useState(INITIAL_ATTACHMENTS);
  const [deletingId, setDeletingId] = useState<string | undefined>();
  const [previewId, setPreviewId] = useState(DOCUMENT_PREVIEW_DEMO_FILES[0]?.id ?? '');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [templateId, setTemplateId] = useState(DEMO_TEMPLATES[0]?.id);
  const [emailTemplateId, setEmailTemplateId] = useState(DEMO_EMAIL_TEMPLATES[0]?.id);

  return (
    <div className="space-y-4">
      <ShowcaseBlock title="DocumentPreview" meta="PDF · CSV · image · text inline renderer">
        <DocumentPreview
          document={{
            name: 'sample_report.pdf',
            mimeType: 'application/pdf',
            sourceUrl: DOCUMENT_PREVIEW_DEMO_PDF_URL,
            downloadUrl: DOCUMENT_PREVIEW_DEMO_PDF_URL,
          }}
          bodyClassName="min-h-[280px]"
        />
      </ShowcaseBlock>

      <ShowcaseBlock title="PdfPreviewPanel" meta="Toolbar + embedded preview">
        <PdfPreviewPanel
          document={{
            name: 'contract_signed.pdf',
            mimeType: 'application/pdf',
            sourceUrl: DOCUMENT_PREVIEW_DEMO_PDF_URL,
            downloadUrl: DOCUMENT_PREVIEW_DEMO_PDF_URL,
          }}
        />
      </ShowcaseBlock>

      <ShowcaseBlock title="DocumentPreviewPanel" meta="SplitView master-detail · file queue">
        <DocumentPreviewPanel
          className="h-[min(32rem,70vh)]"
          files={DOCUMENT_PREVIEW_DEMO_FILES}
          selectedId={previewId}
          onSelect={setPreviewId}
        />
      </ShowcaseBlock>

      <ShowcaseBlock title="AttachmentList" meta="Open · delete · file type icons">
        <AttachmentList
          attachments={attachments}
          isDeleting={deletingId}
          onOpen={(file) => appToast.info(`Open ${file.name}`)}
          onDelete={(id) => {
            setDeletingId(id);
            setTimeout(() => {
              setAttachments((current) => current.filter((a) => a.id !== id));
              setDeletingId(undefined);
              appToast.success('Attachment removed.');
            }, 600);
          }}
        />
      </ShowcaseBlock>

      <ShowcaseBlock title="Template pickers" meta="Inline selection for generate/send flows">
        <div className="grid gap-4 lg:grid-cols-2">
          <TemplatePicker
            templates={DEMO_TEMPLATES}
            value={templateId}
            onChange={setTemplateId}
            title="Document templates"
          />
          <EmailTemplatePicker
            templates={DEMO_EMAIL_TEMPLATES}
            value={emailTemplateId}
            onChange={setEmailTemplateId}
            title="Email templates"
          />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="Document dialogs" meta="Generate · send with EntityForm in dialog">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="cta" onClick={() => setGenerateOpen(true)}>
            Generate document
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSendOpen(true)}>
            Send document
          </Button>
        </div>
      </ShowcaseBlock>

      <DocumentGenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        templates={DEMO_TEMPLATES}
        onGenerate={({ templateId: id, format }) => {
          appToast.success(`Generated ${format.toUpperCase()} from template ${id}.`);
        }}
      />

      <DocumentSendDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        emailTemplates={DEMO_EMAIL_TEMPLATES}
        onSend={(payload) => {
          appToast.success(`Sent to ${payload.recipient}.`);
        }}
      />
    </div>
  );
}
