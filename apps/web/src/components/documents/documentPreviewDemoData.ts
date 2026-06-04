import type { DocumentPreviewListItem } from './documentPreviewTypes';

const DEMO_SAMPLE_PDF = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

const DEMO_SAMPLE_CSV = `Product,Quantity,Amount
License,12,14400
Support hours,48,7200
Implementation,1,8500`;

/** Demo file queue for Documents module and showcase — replace with API data in production. */
export const DOCUMENT_PREVIEW_DEMO_FILES: DocumentPreviewListItem[] = [
  {
    id: 'f1',
    name: 'death_certificate.pdf',
    subtitle: '248 KB · 02.04.2024',
    mimeType: 'application/pdf',
    sourceUrl: DEMO_SAMPLE_PDF,
    downloadUrl: DEMO_SAMPLE_PDF,
  },
  {
    id: 'f2',
    name: 'contract_signed.docx',
    subtitle: '112 KB · 10.04.2024',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileExtension: 'docx',
  },
  {
    id: 'f3',
    name: 'invoice_march.csv',
    subtitle: '2 KB · 28.03.2024',
    mimeType: 'text/csv',
    demoText: DEMO_SAMPLE_CSV,
  },
];

export const DOCUMENT_PREVIEW_DEMO_PDF_URL = DEMO_SAMPLE_PDF;
