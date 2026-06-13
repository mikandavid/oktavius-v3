import type { OsirisStorageClient } from './storageClient';

const SHA_SKIP_BYTES = 50 * 1024 * 1024;

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  // Fallback for jsdom environments where File/Blob.arrayBuffer is unavailable.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export async function computeSha256(file: File): Promise<string | null> {
  if (file.size > SHA_SKIP_BYTES) return null;
  if (!globalThis.crypto?.subtle) return null;
  const buffer = await readFileAsArrayBuffer(file);
  const hash = await globalThis.crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function putToSignedUrl(signedUrl: string, file: File): Promise<void> {
  const response = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
}

export interface UploadOutcome {
  duplicateOfNodeId: string | null;
}

export async function uploadFile(
  client: OsirisStorageClient,
  file: File,
  folderId: string | null,
): Promise<UploadOutcome> {
  const session = await client.initiateUpload({
    folderId,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSizeBytes: file.size,
  });
  await putToSignedUrl(session.signedUrl, file);
  const sha = await computeSha256(file);
  const result = await client.finalizeUpload({
    sessionId: session.sessionId,
    contentSha256: sha ?? undefined,
  });
  return { duplicateOfNodeId: result.duplicateOfNodeId };
}
