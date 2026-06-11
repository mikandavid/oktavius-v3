import { describe, expect, it, vi } from 'vitest';
import { isValidElement, type ReactElement } from 'react';

import { DocumentIcon, UserIcon } from '@/lib/icons';
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
      expect.objectContaining({
        id: 'contacts:contact_1',
        title: 'Anna Beispiel',
        subtitle: 'anna@example.test',
        href: '/contacts/contact_1',
        groupId: 'Contacts',
      }),
    ]);
    expect(fetcher).toHaveBeenCalledWith('/v1/search?q=anna&limit=8', {
      credentials: 'include',
      signal,
    });
  });

  it('normalizes rich result labels, icons, and safe in-app routes', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        results: [
          {
            type: 'contact',
            entityType: 'contacts',
            id: 'contact_1',
            title: 'Anna Beispiel',
            subtitle: 'anna@example.test',
            url: 'https://evil.example.test/contacts/contact_1',
            icon: 'user',
          },
          {
            type: 'document_file',
            entityType: 'documents',
            id: 'doc_1',
            title: 'Contract.pdf',
            path: 'documents/doc_1?preview=true',
            icon: 'file-text',
          },
        ],
      }),
    );
    const runtime = createOsirisSearchRuntime({ baseUrl: '/v1', fetcher });
    const signal = new AbortController().signal;

    const results = await runtime.search('anna', signal);

    expect(results).toEqual([
      expect.objectContaining({
        id: 'contacts:contact_1',
        title: 'Anna Beispiel',
        subtitle: 'anna@example.test',
        href: '/contacts/contact_1',
        groupId: 'Contacts',
      }),
      expect.objectContaining({
        id: 'documents:doc_1',
        title: 'Contract.pdf',
        href: '/documents/doc_1?preview=true',
        groupId: 'Documents',
      }),
    ]);
    expect(isValidElement(results[0]?.icon)).toBe(true);
    expect((results[0]?.icon as ReactElement).type).toBe(UserIcon);
    expect(isValidElement(results[1]?.icon)).toBe(true);
    expect((results[1]?.icon as ReactElement).type).toBe(DocumentIcon);
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
