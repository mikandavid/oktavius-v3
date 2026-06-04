import { appToast } from '@/lib/toast';

import type { DocumentPreviewListItem, PreviewDocument } from './documentPreviewTypes';

export const PREVIEW_SURFACE_CLASS = 'rounded-control border border-border/50 bg-muted/20';

const demoFileCache = new Map<string, File>();

export function resolvePreviewDownloadUrl(
  document: PreviewDocument,
  sourceUrl?: string | null,
): string | null {
  return document.downloadUrl || sourceUrl || document.sourceUrl || null;
}

export function downloadPreviewDocument(
  document: PreviewDocument,
  sourceUrl?: string | null,
): void {
  let url = resolvePreviewDownloadUrl(document, sourceUrl);
  let revokeAfterDownload = false;

  if (!url && document.file) {
    url = URL.createObjectURL(document.file);
    revokeAfterDownload = true;
  }
  if (!url) return;

  try {
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = document.name;
    anchor.rel = 'noopener noreferrer';
    anchor.click();
  } catch {
    appToast.error('Download failed.');
  } finally {
    if (revokeAfterDownload) {
      URL.revokeObjectURL(url);
    }
  }
}

/** Map a queue row to the payload expected by DocumentPreview. */
export function buildPreviewDocument(item: DocumentPreviewListItem): PreviewDocument {
  if (item.demoText) {
    let file = demoFileCache.get(item.id);
    if (!file) {
      file = new File([item.demoText], item.name, {
        type: item.mimeType || 'text/plain',
      });
      demoFileCache.set(item.id, file);
    }

    return {
      name: item.name,
      mimeType: item.mimeType,
      fileExtension: item.fileExtension ?? item.name.split('.').pop(),
      file,
    };
  }

  return {
    name: item.name,
    mimeType: item.mimeType,
    fileExtension: item.fileExtension ?? item.name.split('.').pop(),
    sourceUrl: item.sourceUrl ?? null,
    downloadUrl: item.downloadUrl ?? item.sourceUrl ?? null,
    file: item.file ?? null,
  };
}
