import type { ComponentType } from 'react';

import {
  DocumentIcon,
  FileSpreadsheetIcon,
  FolderIcon,
  type IconProps,
  ImageIcon,
} from '@/lib/icons';

import type { StorageNode } from './types';

export type FileKind = 'folder' | 'image' | 'pdf' | 'sheet' | 'text' | 'other';

export function getFileKind(node: StorageNode): FileKind {
  if (node.nodeType === 'folder') return 'folder';
  const mime = (node.mimeType ?? '').toLowerCase();
  const ext = (node.fileExtension ?? '').toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (['xlsx', 'xls', 'xlsm', 'csv'].includes(ext) || mime.includes('spreadsheet')) return 'sheet';
  if (mime.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'log'].includes(ext)) return 'text';
  return 'other';
}

const KIND_ICON: Record<FileKind, ComponentType<IconProps>> = {
  folder: FolderIcon,
  image: ImageIcon,
  pdf: DocumentIcon,
  sheet: FileSpreadsheetIcon,
  text: DocumentIcon,
  other: DocumentIcon,
};

export function fileIcon(node: StorageNode): ComponentType<IconProps> {
  return KIND_ICON[getFileKind(node)];
}

export function fileAccentClass(kind: FileKind): string {
  switch (kind) {
    case 'folder':
      return 'text-cta';
    case 'image':
      return 'text-success';
    case 'pdf':
      return 'text-destructive';
    case 'sheet':
      return 'text-success';
    case 'text':
      return 'text-info';
    default:
      return 'text-muted-foreground';
  }
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
