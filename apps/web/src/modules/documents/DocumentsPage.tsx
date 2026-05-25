import { useMemo, useState } from 'react';

import { Button, SectionCard, Tabs, TabsContent, TabsList, TabsTrigger } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { PageHeaderOutlineButton } from '@/components/common/PageHeaderButtons';
import { DocumentGenerateDialog } from '@/components/documents/DocumentGenerateDialog';
import { DocumentPreviewPanel } from '@/components/documents/DocumentPreviewPanel';
import { DocumentSendDialog } from '@/components/documents/DocumentSendDialog';
import { EmailTemplatePicker } from '@/components/documents/EmailTemplatePicker';
import { TemplatePicker } from '@/components/documents/TemplatePicker';
import { documentsPageIcon } from '@/lib/modulePageIcons';
import { toast } from '@/lib/toast';

const DOCUMENT_TEMPLATES = [
  {
    id: 'tpl_inv',
    name: 'Standard invoice',
    description: 'Default invoice layout with line items',
    category: 'Invoices',
  },
  {
    id: 'tpl_ctr',
    name: 'Service agreement',
    description: 'Master service agreement PDF',
    category: 'Contracts',
  },
];

const EMAIL_TEMPLATES = [
  {
    id: 'em_inv',
    name: 'Invoice sent',
    subject: 'Your invoice from Oktavius',
    description: 'Notify client when invoice is issued',
  },
  {
    id: 'em_ctr',
    name: 'Contract for signature',
    subject: 'Please sign your agreement',
    description: 'DocuSign-style handoff email',
  },
];

export function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('library');
  const [selectedFileId, setSelectedFileId] = useState('f1');
  const [templateId, setTemplateId] = useState(DOCUMENT_TEMPLATES[0]?.id);
  const [emailTemplateId, setEmailTemplateId] = useState(EMAIL_TEMPLATES[0]?.id);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const headerActions = useMemo(
    () => (
      <>
        <PageHeaderOutlineButton onClick={() => setGenerateOpen(true)}>
          Generate
        </PageHeaderOutlineButton>
        <PageHeaderOutlineButton onClick={() => setSendOpen(true)}>Send</PageHeaderOutlineButton>
      </>
    ),
    [],
  );

  return (
    <>
      <ModulePage
        title="Documents"
        subtitle="Library, preview split-view, and generate/send workflows"
        icon={documentsPageIcon()}
        actions={headerActions}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4 pt-4">
            <DocumentPreviewPanel selectedId={selectedFileId} onSelect={setSelectedFileId} />
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 pt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <TemplatePicker
                templates={DOCUMENT_TEMPLATES}
                value={templateId}
                onChange={setTemplateId}
                title="Document templates"
              />
              <EmailTemplatePicker
                templates={EMAIL_TEMPLATES}
                value={emailTemplateId}
                onChange={setEmailTemplateId}
                title="Email templates"
              />
            </div>
            <SectionCard title="Quick actions">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="cta" onClick={() => setGenerateOpen(true)}>
                  Generate from template
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSendOpen(true)}>
                  Send via email
                </Button>
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </ModulePage>

      <DocumentGenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        templates={DOCUMENT_TEMPLATES}
        onGenerate={({ templateId: id, format }) => {
          toast.success(`Generated ${format.toUpperCase()} from ${id}.`);
        }}
      />

      <DocumentSendDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        emailTemplates={EMAIL_TEMPLATES}
        onSend={(payload) => toast.success(`Sent to ${payload.recipient}.`)}
      />
    </>
  );
}
