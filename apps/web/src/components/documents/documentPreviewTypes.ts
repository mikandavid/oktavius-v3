export type PreviewDocumentKind = 'image' | 'pdf' | 'text' | 'csv' | 'excel' | 'other';

/** Controls the browser PDF viewer's initial fit mode in iframe previews. */
export type PdfPreviewFitMode = 'auto' | 'page-fit' | 'page-width';

export interface PreviewDocument {
  name: string;
  mimeType?: string | null;
  fileExtension?: string | null;
  sourceUrl?: string | null;
  downloadUrl?: string | null;
  file?: File | null;
}

/** Row in a split-view document queue (library tab, entity files, etc.). */
export type DocumentPreviewListItem = PreviewDocument & {
  id: string;
  /** Shown under the file name in the queue, e.g. `248 KB · 18.04.2024`. */
  subtitle?: string;
  /** Demo helper: inline text rendered as a File when no URL is available. */
  demoText?: string;
};

export function inferPreviewDocumentKind(document: PreviewDocument): PreviewDocumentKind {
  const mime = (document.mimeType || document.file?.type || '').toLowerCase();
  const ext = (
    document.fileExtension ||
    document.file?.name.split('.').pop() ||
    document.name.split('.').pop() ||
    ''
  ).toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (ext === 'csv' || ext === 'tsv' || mime.includes('csv')) return 'csv';
  if (
    ['xlsx', 'xls', 'xlsm'].includes(ext) ||
    mime.includes('spreadsheet') ||
    mime.includes('excel')
  ) {
    return 'excel';
  }
  if (mime.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'log'].includes(ext)) {
    return 'text';
  }

  return 'other';
}

export function withPdfFitMode(url: string, fitMode: PdfPreviewFitMode): string {
  const params: string[] = ['pagemode=none'];
  if (fitMode === 'page-fit') {
    params.push('zoom=page-fit', 'view=Fit');
  } else if (fitMode === 'page-width') {
    params.push('zoom=page-width');
  }

  const [baseUrl, hash = ''] = url.split('#');
  const fragment = [hash, ...params].filter(Boolean).join('&');
  return `${baseUrl}#${fragment}`;
}
