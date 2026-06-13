import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOsirisStorageClient } from './storageClient';

const BASE = 'https://api.example.test/v1';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createOsirisStorageClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('lists nodes and normalizes snake_case payloads', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            id: 'f1',
            parent_id: null,
            node_type: 'file',
            name: 'Q3.pdf',
            mime_type: 'application/pdf',
            file_extension: 'pdf',
            file_size_bytes: 2048,
            upload_status: 'ready',
            trashed_at: null,
            purge_after_at: null,
            created_by: 'u1',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-02T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 50,
        total_pages: 1,
        has_more: false,
      }),
    );

    const client = createOsirisStorageClient({ baseUrl: BASE });
    const result = await client.listNodes({ folderId: 'root', sortBy: 'name', sortDir: 'asc' });

    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain(`${BASE}/storage?`);
    expect(url).toContain('folderId=root');
    expect(url).toContain('sortBy=name');
    expect(result.total).toBe(1);
    expect(result.data[0]!).toMatchObject({
      id: 'f1',
      parentId: null,
      nodeType: 'file',
      name: 'Q3.pdf',
      mimeType: 'application/pdf',
      fileExtension: 'pdf',
      fileSizeBytes: 2048,
      uploadStatus: 'ready',
    });
  });

  it('also accepts camelCase payloads', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([{ id: 'd1', nodeType: 'folder', name: 'Sales', children: [] }]),
    );
    const client = createOsirisStorageClient({ baseUrl: BASE });
    const tree = await client.listTree();
    expect(tree[0]!).toMatchObject({ id: 'd1', nodeType: 'folder', name: 'Sales' });
    expect(tree[0]!.children).toEqual([]);
  });

  it('creates a folder via POST', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'new', node_type: 'folder', name: 'Docs', parent_id: 'p1' }, 201),
    );
    const client = createOsirisStorageClient({ baseUrl: BASE });
    const node = await client.createFolder({ name: 'Docs', parentId: 'p1' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${BASE}/storage/folders`);
    expect((init as RequestInit).method).toBe('POST');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      name: 'Docs',
      parentId: 'p1',
    });
    expect(node).toMatchObject({ id: 'new', nodeType: 'folder', name: 'Docs' });
  });

  it('moves nodes via bulk endpoint', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ moved: 1 }));
    const client = createOsirisStorageClient({ baseUrl: BASE });
    await client.move(['n1'], 'target');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${BASE}/storage/bulk/move`);
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      nodeIds: ['n1'],
      targetFolderId: 'target',
    });
  });

  it('returns a signed preview url', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ url: 'https://signed/preview' }));
    const client = createOsirisStorageClient({ baseUrl: BASE });
    expect(await client.previewUrl('n1')).toBe('https://signed/preview');
  });

  it('throws the backend error message on failure', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Nope' }, 400));
    const client = createOsirisStorageClient({ baseUrl: BASE });
    await expect(client.listTree()).rejects.toThrow('Nope');
  });
});
