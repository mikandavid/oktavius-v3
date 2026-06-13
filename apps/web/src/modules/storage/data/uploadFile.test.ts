import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { computeSha256, putToSignedUrl } from './uploadFile';

describe('computeSha256', () => {
  it('returns null for files larger than 50MB', async () => {
    const big = { size: 51 * 1024 * 1024 } as File;
    expect(await computeSha256(big)).toBeNull();
  });

  it('hashes small files when crypto.subtle is available', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'a.bin');
    const hash = await computeSha256(file);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('putToSignedUrl', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('PUTs the file with the correct headers', async () => {
    const file = new File(['hi'], 'a.txt', { type: 'text/plain' });
    await putToSignedUrl('https://signed/url', file);
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ];
    expect(url).toBe('https://signed/url');
    expect(init.method).toBe('PUT');
    expect(init.headers['Content-Type']).toBe('text/plain');
    expect(init.headers['x-upsert']).toBe('true');
  });

  it('throws on non-2xx', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    await expect(putToSignedUrl('https://x', new File(['x'], 'x'))).rejects.toThrow();
  });
});
