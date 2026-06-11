import { describe, expect, it, vi } from 'vitest';

import { createOsirisSearchRuntime } from './searchClient';

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createOsirisSearchRuntime', () => {
  it('maps Osiris global search results into command palette results', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        results: [
          {
            type: 'contacts',
            id: 'contact_1',
            title: 'Anna Beispiel',
            subtitle: 'anna@example.test',
            url: '/contacts/contact_1',
            icon: 'user',
            score: 1,
          },
        ],
      }),
    );
    const runtime = createOsirisSearchRuntime({ baseUrl: '/v1', fetcher });
    const signal = new AbortController().signal;

    await expect(runtime.search('anna', signal)).resolves.toEqual([
      {
        id: 'contacts:contact_1',
        title: 'Anna Beispiel',
        subtitle: 'anna@example.test',
        href: '/contacts/contact_1',
        groupId: 'Contacts',
      },
    ]);
    expect(fetcher).toHaveBeenCalledWith('/v1/search?q=anna&limit=8', {
      credentials: 'include',
      signal,
    });
  });

  it('does not call the backend for blank or aborted searches', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ results: [] }));
    const runtime = createOsirisSearchRuntime({ baseUrl: '/v1', fetcher });
    const controller = new AbortController();
    controller.abort();

    await expect(runtime.search('   ', new AbortController().signal)).resolves.toEqual([]);
    await expect(runtime.search('anna', controller.signal)).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
