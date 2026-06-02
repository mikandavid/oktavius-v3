import { useEffect, useMemo, useState } from 'react';

import {
  AlertBanner,
  Button,
  SectionCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import {
  MODULE_TABS_CONTENT_FILL_CLASS,
  MODULE_TABS_CONTENT_SCROLL_CLASS,
  MODULE_TABS_FILL_CLASS,
} from '@/components/common/pageChrome';
import { useOrgProfile } from '@/lib/org-profiles/useOrgProfile';
import { PageHeaderOutlineButton } from '@/components/common/PageHeaderButtons';
import { DocumentGenerateDialog } from '@/components/documents/DocumentGenerateDialog';
import {
  completeDocumentGeneration,
  completeDocumentSend,
} from '@/components/documents/documentActions';
import { DocumentPreviewPanel } from '@/components/documents/DocumentPreviewPanel';
import { DOCUMENT_PREVIEW_DEMO_FILES } from '@/components/documents/documentPreviewDemoData';
import { DocumentSendDialog } from '@/components/documents/DocumentSendDialog';
import { EmailTemplatePicker } from '@/components/documents/EmailTemplatePicker';
import { PageFileDrop } from '@/components/forms/PageFileDrop';
import { TemplatePicker } from '@/components/documents/TemplatePicker';
import { documentsPageIcon } from '@/lib/modulePageIcons';
import { appToast } from '@/lib/toast';

import { addGeneratedDocument, addUploadedDocuments, markDocumentSent } from './documentLifecycle';
import { loadStoredDocuments, storeDocuments } from './documentStorage';

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

const KUNZ_DOC_TEMPLATES = [
  {
    id: 'tpl_ba',
    name: 'Bestattungsauftrag digitalisieren',
    description:
      'Extrahiert Kundendaten und Leistungspositionen aus Bestattungsaufträgen (Kunz-Bestattungsauftrag).',
    category: 'Doc processing',
  },
];

function getDocumentStorage() {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function DocumentsPage() {
  const profile = useOrgProfile();
  const isFuneral = profile.industryKey === 'funeral';
  const [activeTab, setActiveTab] = useState('library');
  const initialFiles = useMemo(
    () => loadStoredDocuments(getDocumentStorage(), DOCUMENT_PREVIEW_DEMO_FILES),
    [],
  );
  const [files, setFiles] = useState(initialFiles);
  const [selectedFileId, setSelectedFileId] = useState(initialFiles[0]?.id ?? '');
  const [templateId, setTemplateId] = useState(DOCUMENT_TEMPLATES[0]?.id);
  const [emailTemplateId, setEmailTemplateId] = useState(EMAIL_TEMPLATES[0]?.id);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const handleFilesUpload = (uploads: File[]) => {
    const result = addUploadedDocuments({
      files,
      uploads,
      uploadedAt: new Date().toISOString(),
    });
    setFiles(result.files);
    setSelectedFileId(result.selectedFileId);
    setActiveTab('library');
    appToast.success(`Uploaded ${uploads.length} document${uploads.length === 1 ? '' : 's'}.`);
  };

  useEffect(() => {
    storeDocuments(getDocumentStorage(), files);
  }, [files]);

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
        title={profile.terminology.documents}
        subtitle={
          isFuneral
            ? 'Ablage, Bestattungsauftrag-Einlesen und Vorlagen — Bestattung Kunz Demo'
            : 'Library, preview split-view, and generate/send workflows'
        }
        icon={documentsPageIcon()}
        actions={headerActions}
        fillHeight
      >
        {isFuneral ? (
          <AlertBanner tone="info" className="shrink-0">
            <strong className="font-medium">Bestattungsauftrag einlesen.</strong> Osiris flow
            „Kunz-Bestattungsauftrag“: PDF hochladen → Felder in den Sterbefall übernehmen. In v3
            als UI-Demo; Live-Anbindung folgt mit API/doc-processing.
          </AlertBanner>
        ) : null}
        <Tabs value={activeTab} onValueChange={setActiveTab} className={MODULE_TABS_FILL_CLASS}>
          <TabsList className="shrink-0">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className={MODULE_TABS_CONTENT_FILL_CLASS}>
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <PageFileDrop
                accept=".pdf,.doc,.docx,.csv,.txt,image/*,application/pdf"
                className="shrink-0"
                onFiles={handleFilesUpload}
              />
              <DocumentPreviewPanel
                files={files}
                selectedId={selectedFileId}
                onSelect={setSelectedFileId}
              />
            </div>
          </TabsContent>

          <TabsContent value="templates" className={MODULE_TABS_CONTENT_SCROLL_CLASS}>
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <TemplatePicker
                  templates={isFuneral ? KUNZ_DOC_TEMPLATES : DOCUMENT_TEMPLATES}
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
            </div>
          </TabsContent>
        </Tabs>
      </ModulePage>

      <DocumentGenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        templates={DOCUMENT_TEMPLATES}
        onGenerate={(payload) =>
          completeDocumentGeneration({
            payload,
            generateDocument: async (nextPayload) => {
              const result = addGeneratedDocument({
                files,
                templates: DOCUMENT_TEMPLATES,
                payload: nextPayload,
                generatedAt: new Date().toISOString(),
              });
              setFiles(result.files);
              setSelectedFileId(result.selectedFileId);
              setActiveTab('library');
            },
            toast: appToast,
          })
        }
      />

      <DocumentSendDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        emailTemplates={EMAIL_TEMPLATES}
        onSend={(payload) =>
          completeDocumentSend({
            payload,
            sendDocument: async (nextPayload) => {
              setFiles((current) =>
                markDocumentSent({
                  files: current,
                  fileId: selectedFileId,
                  recipient: nextPayload.recipient,
                  sentAt: new Date().toISOString(),
                }),
              );
            },
            toast: appToast,
          })
        }
      />
    </>
  );
}
