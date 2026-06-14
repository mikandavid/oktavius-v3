import { zip } from 'fflate';

import type { OsirisStorageClient } from './storageClient';
import type { StorageNode } from './types';

/** Backend caps list pageSize at 200, so we page through large folders. */
const LIST_PAGE_SIZE = 200;

interface ZipFileEntry {
  id: string;
  /** Path inside the archive, e.g. "Reports/2026/q1.pdf". */
  path: string;
}

/**
 * Recursively collect every file under a folder, preserving its relative path.
 * Pages through results because a folder may hold more nodes than one page.
 */
async function gatherFolderFiles(
  client: OsirisStorageClient,
  folderId: string,
  prefix: string,
): Promise<ZipFileEntry[]> {
  const entries: ZipFileEntry[] = [];
  let page = 1;
  for (;;) {
    const result = await client.listNodes({ folderId, page, pageSize: LIST_PAGE_SIZE });
    for (const child of result.data) {
      const path = `${prefix}${child.name}`;
      if (child.nodeType === 'folder') {
        entries.push(...(await gatherFolderFiles(client, child.id, `${path}/`)));
      } else {
        entries.push({ id: child.id, path });
      }
    }
    if (!result.hasMore) break;
    page += 1;
  }
  return entries;
}

/** Ensure every archive path is unique by suffixing collisions with " (n)". */
function dedupePaths(entries: ZipFileEntry[]): ZipFileEntry[] {
  const seen = new Set<string>();
  return entries.map((entry) => {
    if (!seen.has(entry.path)) {
      seen.add(entry.path);
      return entry;
    }
    const dot = entry.path.lastIndexOf('.');
    const slash = entry.path.lastIndexOf('/');
    const hasExt = dot > slash;
    const base = hasExt ? entry.path.slice(0, dot) : entry.path;
    const ext = hasExt ? entry.path.slice(dot) : '';
    let counter = 2;
    let candidate = `${base} (${counter})${ext}`;
    while (seen.has(candidate)) {
      counter += 1;
      candidate = `${base} (${counter})${ext}`;
    }
    seen.add(candidate);
    return { ...entry, path: candidate };
  });
}

/**
 * Build a ZIP archive (as a Blob) from the selected storage nodes. Folders are
 * walked recursively and their contents kept under the folder's path; files are
 * placed at the archive root. Each file is fetched from its signed download URL.
 */
export async function buildStorageZip(
  client: OsirisStorageClient,
  nodes: StorageNode[],
): Promise<Blob> {
  const collected: ZipFileEntry[] = [];
  for (const node of nodes) {
    if (node.nodeType === 'folder') {
      collected.push(...(await gatherFolderFiles(client, node.id, `${node.name}/`)));
    } else {
      collected.push({ id: node.id, path: node.name });
    }
  }

  const entries = dedupePaths(collected);
  if (entries.length === 0) {
    throw new Error('No files to download.');
  }

  const files: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    const url = await client.downloadUrl(entry.id);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch "${entry.path}" (${response.status}).`);
    }
    files[entry.path] = new Uint8Array(await response.arrayBuffer());
  }

  const archive = await new Promise<Uint8Array>((resolve, reject) => {
    zip(files, (error, data) => (error ? reject(error) : resolve(data)));
  });

  // Copy into an ArrayBuffer-backed view so the Blob typings are satisfied.
  return new Blob([new Uint8Array(archive)], { type: 'application/zip' });
}
