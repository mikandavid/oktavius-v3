import type { DocumentPreviewListItem } from '@/components/documents/documentPreviewTypes';

export const DOCUMENT_LIBRARY_STORAGE_KEY = 'oktavius.documents.library';

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' || value === undefined ? value : undefined;
}

function optionalNullableString(value: unknown): string | null | undefined {
  return typeof value === 'string' || value === null || value === undefined ? value : undefined;
}

function toStoredDocument(value: unknown): DocumentPreviewListItem | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<DocumentPreviewListItem>;
  if (
    typeof candidate.id !== 'string' ||
    candidate.id.length === 0 ||
    typeof candidate.name !== 'string' ||
    candidate.name.length === 0
  ) {
    return null;
  }

  const subtitle = optionalString(candidate.subtitle);
  const mimeType = optionalNullableString(candidate.mimeType);
  const fileExtension = optionalNullableString(candidate.fileExtension);
  const sourceUrl = optionalNullableString(candidate.sourceUrl);
  const downloadUrl = optionalNullableString(candidate.downloadUrl);
  const demoText = optionalString(candidate.demoText);

  if (
    subtitle === undefined ||
    mimeType === undefined ||
    fileExtension === undefined ||
    sourceUrl === undefined ||
    downloadUrl === undefined ||
    demoText === undefined
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    ...(subtitle !== undefined ? { subtitle } : {}),
    ...(mimeType !== undefined ? { mimeType } : {}),
    ...(fileExtension !== undefined ? { fileExtension } : {}),
    ...(sourceUrl !== undefined ? { sourceUrl } : {}),
    ...(downloadUrl !== undefined ? { downloadUrl } : {}),
    ...(demoText !== undefined ? { demoText } : {}),
  };
}

export function loadStoredDocuments(
  storage: Storage | undefined,
  fallbackFiles: DocumentPreviewListItem[],
): DocumentPreviewListItem[] {
  if (!storage) return fallbackFiles;

  try {
    const raw = storage.getItem(DOCUMENT_LIBRARY_STORAGE_KEY);
    if (!raw) return fallbackFiles;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return fallbackFiles;
    const files = parsed
      .map((item) => toStoredDocument(item))
      .filter((item): item is DocumentPreviewListItem => item !== null);
    return files.length > 0 ? files : fallbackFiles;
  } catch {
    return fallbackFiles;
  }
}

export function storeDocuments(storage: Storage | undefined, files: DocumentPreviewListItem[]) {
  if (!storage) return;
  const storedFiles = files
    .map((file) => toStoredDocument(file))
    .filter((file): file is DocumentPreviewListItem => file !== null);
  storage.setItem(DOCUMENT_LIBRARY_STORAGE_KEY, JSON.stringify(storedFiles));
}
