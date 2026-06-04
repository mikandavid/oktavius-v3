import type { DocumentGenerationPayload } from '@/components/documents/documentActions';
import type { DocumentPreviewListItem } from '@/components/documents/documentPreviewTypes';
import type { TemplateOption } from '@/components/documents/TemplatePicker';
import { formatBytes } from '@/lib/formatBytes';

type AddGeneratedDocumentOptions = {
  files: DocumentPreviewListItem[];
  templates: TemplateOption[];
  payload: DocumentGenerationPayload;
  generatedAt: string;
};

type MarkDocumentSentOptions = {
  files: DocumentPreviewListItem[];
  fileId: string;
  recipient: string;
  sentAt: string;
};

type AddUploadedDocumentsOptions = {
  files: DocumentPreviewListItem[];
  uploads: File[];
  uploadedAt: string;
};

const MIME_BY_FORMAT: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function fileExtension(name: string) {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() : undefined;
}

export function addGeneratedDocument({
  files,
  templates,
  payload,
  generatedAt,
}: AddGeneratedDocumentOptions) {
  const template = templates.find((item) => item.id === payload.templateId);
  const templateName = template?.name ?? payload.templateId;
  const format = payload.format.toLowerCase();
  const id = `generated_${Date.now()}`;
  const name = `${slugify(templateName) || 'document'}.${format}`;
  const generatedFile: DocumentPreviewListItem = {
    id,
    name,
    subtitle: `Generated · ${formatTimestamp(generatedAt)}`,
    mimeType: MIME_BY_FORMAT[format] ?? 'text/plain',
    fileExtension: format,
    demoText: `${templateName}\n\nGenerated from template ${payload.templateId} as ${format.toUpperCase()}.`,
  };

  return {
    files: [generatedFile, ...files],
    selectedFileId: id,
  };
}

export function markDocumentSent({
  files,
  fileId,
  recipient,
  sentAt,
}: MarkDocumentSentOptions): DocumentPreviewListItem[] {
  return files.map((file) =>
    file.id === fileId
      ? {
          ...file,
          subtitle: `Sent to ${recipient} · ${formatTimestamp(sentAt)}`,
        }
      : file,
  );
}

export function addUploadedDocuments({ files, uploads, uploadedAt }: AddUploadedDocumentsOptions) {
  const uploadedFiles = uploads.map<DocumentPreviewListItem>((file, index) => ({
    id: `uploaded_${Date.now()}_${index}`,
    name: file.name,
    subtitle: `Uploaded · ${formatTimestamp(uploadedAt)} · ${formatBytes(file.size)}`,
    mimeType: file.type || undefined,
    fileExtension: fileExtension(file.name),
    file,
  }));

  return {
    files: [...uploadedFiles, ...files],
    selectedFileId: uploadedFiles[0]?.id ?? files[0]?.id ?? '',
  };
}
