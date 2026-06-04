import { describe, expect, it } from 'vitest';

import {
  DOCUMENT_LIBRARY_STORAGE_KEY,
  loadStoredDocuments,
  storeDocuments,
} from './documentStorage';
import type { DocumentPreviewListItem } from '@/components/documents/documentPreviewTypes';

function createStorage(seed: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(seed));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

const fallbackFiles: DocumentPreviewListItem[] = [
  {
    id: 'fallback',
    name: 'fallback.pdf',
    subtitle: 'Seed file',
    mimeType: 'application/pdf',
  },
];

const storedFile: DocumentPreviewListItem = {
  id: 'generated_1',
  name: 'standard_invoice.pdf',
  subtitle: 'Generated · 01.06.2026, 12:00',
  mimeType: 'application/pdf',
  fileExtension: 'pdf',
  sourceUrl: 'https://example.test/invoice.pdf',
  downloadUrl: 'https://example.test/invoice.pdf',
  demoText: 'Generated invoice preview',
};

describe('document storage helpers', () => {
  it('loads fallback documents when storage is empty or invalid', () => {
    expect(loadStoredDocuments(createStorage(), fallbackFiles)).toEqual(fallbackFiles);
    expect(
      loadStoredDocuments(
        createStorage({ [DOCUMENT_LIBRARY_STORAGE_KEY]: 'not-json' }),
        fallbackFiles,
      ),
    ).toEqual(fallbackFiles);
  });

  it('loads only valid stored document metadata', () => {
    const storage = createStorage({
      [DOCUMENT_LIBRARY_STORAGE_KEY]: JSON.stringify([
        storedFile,
        { ...storedFile, id: '', name: 'missing id' },
        { ...storedFile, id: 'missing_name', name: '' },
      ]),
    });

    expect(loadStoredDocuments(storage, fallbackFiles)).toEqual([storedFile]);
  });

  it('stores serializable document metadata without File objects', () => {
    const storage = createStorage();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    storeDocuments(storage, [{ ...storedFile, file }]);

    expect(loadStoredDocuments(storage, fallbackFiles)).toEqual([storedFile]);
    expect(JSON.parse(storage.getItem(DOCUMENT_LIBRARY_STORAGE_KEY) ?? '[]')[0]).not.toHaveProperty(
      'file',
    );
  });
});
