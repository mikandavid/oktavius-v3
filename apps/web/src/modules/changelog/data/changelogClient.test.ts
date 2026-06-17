import { afterEach, describe, expect, it, vi } from 'vitest';

import { createChangelogClient } from './changelogClient';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createChangelogClient.listReleases', () => {
  it('requests /changelog with credentials and returns parsed releases', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        releases: [
          {
            version: '3.4.0',
            date: '2026-06-17',
            title: 'June release',
            items: [
              { type: 'added', text: 'Changelog page' },
              { type: 'fixed', text: 'Sidebar focus' },
            ],
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = createChangelogClient({ baseUrl: '/v1' });
    const result = await client.listReleases();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/v1/changelog');
    expect((init as RequestInit).credentials).toBe('include');
    expect(result.releases).toHaveLength(1);
    expect(result.releases[0]).toEqual({
      version: '3.4.0',
      date: '2026-06-17',
      title: 'June release',
      items: [
        { type: 'added', text: 'Changelog page' },
        { type: 'fixed', text: 'Sidebar focus' },
      ],
    });
  });

  it('sorts releases newest-first and coerces unknown item types to "improved"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          releases: [
            { version: '3.3.0', date: '2026-06-14', items: [{ type: 'whoops', text: 'x' }] },
            { version: '3.4.0', date: '2026-06-17', items: [] },
          ],
        }),
      ),
    );

    const client = createChangelogClient({ baseUrl: '/v1' });
    const result = await client.listReleases();

    expect(result.releases.map((r) => r.version)).toEqual(['3.4.0', '3.3.0']);
    expect(result.releases[1].items[0].type).toBe('improved');
  });

  it('drops items with no text and tolerates a missing releases array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          releases: [
            {
              version: '3.4.0',
              date: '2026-06-17',
              items: [{ type: 'added' }, { type: 'added', text: 'kept' }],
            },
            { version: '3.2.0', date: '2026-06-10' },
          ],
        }),
      ),
    );

    const client = createChangelogClient({ baseUrl: '/v1' });
    const result = await client.listReleases();

    expect(result.releases[0].items).toEqual([{ type: 'added', text: 'kept' }]);
    expect(result.releases[1].items).toEqual([]);
  });

  it('returns an empty result on 404 (endpoint not built yet)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));

    const client = createChangelogClient({ baseUrl: '/v1' });
    const result = await client.listReleases();

    expect(result).toEqual({ releases: [] });
  });

  it('throws on other non-OK responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'boom' }, 500)));

    const client = createChangelogClient({ baseUrl: '/v1' });
    await expect(client.listReleases()).rejects.toThrow('boom');
  });
});
