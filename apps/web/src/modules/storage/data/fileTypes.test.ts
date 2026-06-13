import { describe, expect, it } from 'vitest';

import { formatBytes, getFileKind } from './fileTypes';
import type { StorageNode } from './types';

function node(partial: Partial<StorageNode>): StorageNode {
  return {
    id: 'n1',
    parentId: null,
    nodeType: 'file',
    name: 'file',
    mimeType: null,
    fileExtension: null,
    fileSizeBytes: null,
    uploadStatus: 'ready',
    trashedAt: null,
    purgeAfterAt: null,
    createdBy: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  };
}

describe('formatBytes', () => {
  it('formats common sizes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(2_400_000)).toBe('2.3 MB');
  });
  it('handles null', () => {
    expect(formatBytes(null)).toBe('—');
  });
});

describe('getFileKind', () => {
  it('detects folders', () => {
    expect(getFileKind(node({ nodeType: 'folder' }))).toBe('folder');
  });
  it('detects images by mime', () => {
    expect(getFileKind(node({ mimeType: 'image/png' }))).toBe('image');
  });
  it('detects pdf by extension', () => {
    expect(getFileKind(node({ fileExtension: 'pdf' }))).toBe('pdf');
  });
  it('detects spreadsheets', () => {
    expect(getFileKind(node({ fileExtension: 'xlsx' }))).toBe('sheet');
  });
  it('falls back to other', () => {
    expect(getFileKind(node({ fileExtension: 'bin' }))).toBe('other');
  });
});
