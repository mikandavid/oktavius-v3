import { describe, expect, it } from 'vitest';

import { addGeneratedDocument, addUploadedDocuments, markDocumentSent } from './documentLifecycle';

const files = [
  {
    id: 'f1',
    name: 'invoice_march.pdf',
    subtitle: '248 KB · 02.04.2024',
    mimeType: 'application/pdf',
  },
];

const templates = [
  {
    id: 'tpl_inv',
    name: 'Standard invoice',
    description: 'Default invoice layout with line items',
    category: 'Invoices',
  },
];

describe('document lifecycle helpers', () => {
  it('adds generated documents to the library with previewable content', () => {
    const result = addGeneratedDocument({
      files,
      templates,
      payload: { templateId: 'tpl_inv', format: 'pdf' },
      generatedAt: '2026-06-01T10:00:00.000Z',
    });

    expect(result.files[0]).toMatchObject({
      id: expect.stringMatching(/^generated_/),
      name: 'standard_invoice.pdf',
      subtitle: 'Generated · 01.06.2026, 12:00',
      mimeType: 'application/pdf',
      fileExtension: 'pdf',
    });
    expect(result.files[0]?.demoText).toContain('Standard invoice');
    expect(result.selectedFileId).toBe(result.files[0]?.id);
    expect(result.files.slice(1)).toEqual(files);
  });

  it('marks a document as sent without losing existing metadata', () => {
    const result = markDocumentSent({
      files,
      fileId: 'f1',
      recipient: 'billing@example.test',
      sentAt: '2026-06-01T10:00:00.000Z',
    });

    expect(result[0]).toEqual({
      ...files[0],
      subtitle: 'Sent to billing@example.test · 01.06.2026, 12:00',
    });
  });

  it('adds uploaded files to the library with preview metadata', () => {
    const upload = new File(['pdf bytes'], 'kunz_auftrag.pdf', { type: 'application/pdf' });

    const result = addUploadedDocuments({
      files,
      uploads: [upload],
      uploadedAt: '2026-06-01T10:00:00.000Z',
    });

    expect(result.files[0]).toMatchObject({
      id: expect.stringMatching(/^uploaded_/),
      name: 'kunz_auftrag.pdf',
      subtitle: 'Uploaded · 01.06.2026, 12:00 · 9 B',
      mimeType: 'application/pdf',
      fileExtension: 'pdf',
      file: upload,
    });
    expect(result.selectedFileId).toBe(result.files[0]?.id);
    expect(result.files.slice(1)).toEqual(files);
  });
});
