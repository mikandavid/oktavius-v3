import { describe, expect, it } from 'vitest';

import { isEditableTextFile, markdownToFile, nextUntitledName } from './textFiles';
import type { StorageNode } from './types';

function file(partial: Partial<StorageNode>): StorageNode {
  return {
    id: 'x',
    parentId: null,
    nodeType: 'file',
    name: 'a.md',
    mimeType: 'text/markdown',
    fileExtension: 'md',
    fileSizeBytes: 1,
    uploadStatus: 'ready',
    trashedAt: null,
    purgeAfterAt: null,
    createdBy: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  };
}

describe('isEditableTextFile', () => {
  it('accepts md, markdown and txt by extension', () => {
    expect(isEditableTextFile(file({ fileExtension: 'md' }))).toBe(true);
    expect(isEditableTextFile(file({ fileExtension: 'markdown' }))).toBe(true);
    expect(isEditableTextFile(file({ fileExtension: 'txt' }))).toBe(true);
  });
  it('accepts text/* and text/markdown by mime', () => {
    expect(isEditableTextFile(file({ fileExtension: null, mimeType: 'text/plain' }))).toBe(true);
    expect(isEditableTextFile(file({ fileExtension: null, mimeType: 'text/markdown' }))).toBe(true);
  });
  it('rejects folders and non-text files', () => {
    expect(isEditableTextFile(file({ nodeType: 'folder' }))).toBe(false);
    expect(isEditableTextFile(file({ fileExtension: 'pdf', mimeType: 'application/pdf' }))).toBe(
      false,
    );
  });
});

describe('nextUntitledName', () => {
  it('returns Untitled.md when none exist', () => {
    expect(nextUntitledName([])).toBe('Untitled.md');
    expect(nextUntitledName(['report.md'])).toBe('Untitled.md');
  });
  it('increments when names collide (case-insensitive)', () => {
    expect(nextUntitledName(['Untitled.md'])).toBe('Untitled-2.md');
    expect(nextUntitledName(['untitled.md', 'Untitled-2.md'])).toBe('Untitled-3.md');
  });
});

describe('markdownToFile', () => {
  it('wraps markdown in a File with the given name and markdown mime', () => {
    const f = markdownToFile('Notes.md', '# hi');
    expect(f.name).toBe('Notes.md');
    expect(f.type).toBe('text/markdown');
  });
});
