import type { StorageNode } from './types';

const EDITABLE_EXTENSIONS = new Set(['md', 'markdown', 'txt']);

/** True for text files we open in the markdown editor rather than the preview. */
export function isEditableTextFile(node: StorageNode): boolean {
  if (node.nodeType !== 'file') return false;
  const ext = (node.fileExtension ?? '').toLowerCase();
  if (EDITABLE_EXTENSIONS.has(ext)) return true;
  const mime = (node.mimeType ?? '').toLowerCase();
  return mime === 'text/markdown' || mime.startsWith('text/');
}

/** Collision-safe default name for a new text file in a folder. */
export function nextUntitledName(existingNames: string[]): string {
  const taken = new Set(existingNames.map((name) => name.toLowerCase()));
  if (!taken.has('untitled.md')) return 'Untitled.md';
  let n = 2;
  while (taken.has(`untitled-${n}.md`)) n += 1;
  return `Untitled-${n}.md`;
}

/** Builds a File from markdown text for the upload flow. */
export function markdownToFile(name: string, markdown: string): File {
  return new File([markdown], name, { type: 'text/markdown' });
}
