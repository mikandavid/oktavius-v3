import { describe, expect, it, vi } from 'vitest';

import {
  createApiAgentTransport,
  createConfiguredAgentTransport,
  runAgentTurn,
} from './agentRuntime';
import type { AgentPageContextSnapshot } from './page-routing';

const pageSnapshot: AgentPageContextSnapshot = {
  moduleLabel: 'Clients',
  routeLabel: 'Apex Technologies',
  links: [],
};

const SNAPSHOT = { moduleLabel: '', routeLabel: '' } as unknown as AgentPageContextSnapshot;

describe('runAgentTurn', () => {
  it('forwards onStreamMessage to the transport', async () => {
    const onStreamMessage = vi.fn();
    const transport = vi.fn((request: { onStreamMessage?: (m: unknown) => void }) => {
      request.onStreamMessage?.({ id: 'a1', role: 'assistant', createdAt: 'now', content: 'hi' });
      return Promise.resolve([
        { id: 'a1', role: 'assistant' as const, createdAt: 'now', content: 'hi' },
      ]);
    });

    await runAgentTurn({
      content: 'hello',
      createdAt: 'now',
      pageSnapshot: SNAPSHOT,
      onStreamMessage,
      transport,
    });

    expect(transport).toHaveBeenCalledTimes(1);
    expect(onStreamMessage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a1', content: 'hi' }),
    );
  });
});

describe('agent runtime adapter', () => {
  it('returns assistant messages decorated with page context', async () => {
    const messages = await runAgentTurn({
      content: 'Find client Apex',
      createdAt: '2026-06-01T10:00:00.000Z',
      pageSnapshot,
    });

    expect(messages[0]).toMatchObject({
      role: 'assistant',
      createdAt: '2026-06-01T10:00:00.000Z',
    });
    expect(messages[0]?.content).toContain('_Context: Clients · Apex Technologies_');
  });

  it('uses an injected transport when provided', async () => {
    const messages = await runAgentTurn({
      content: 'Hello',
      createdAt: '2026-06-01T10:00:00.000Z',
      pageSnapshot,
      transport: async (request) => [
        {
          id: 'assistant_custom',
          role: 'assistant',
          createdAt: request.createdAt,
          content: `Transport saw ${request.pageSnapshot.moduleLabel}`,
        },
      ],
    });

    expect(messages).toEqual([
      {
        id: 'assistant_custom',
        role: 'assistant',
        createdAt: '2026-06-01T10:00:00.000Z',
        content: 'Transport saw Clients',
      },
    ]);
  });

  it('streams API assistant deltas and resolves the final assistant message', async () => {
    const encoder = new TextEncoder();
    const fetcher = vi.fn(async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"type":"delta","delta":"Hello"}\n'));
          controller.enqueue(encoder.encode('data: {"type":"delta","delta":" world"}\n'));
          controller.enqueue(encoder.encode('data: {"type":"done"}\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    });
    const onStreamMessage = vi.fn();
    const transport = createApiAgentTransport({
      endpoint: '/api/agent/stream',
      token: 'secret',
      fetcher,
    });

    const messages = await transport({
      content: 'Summarize this page',
      createdAt: '2026-06-01T10:00:00.000Z',
      pageSnapshot,
      onStreamMessage,
    });

    expect(fetcher).toHaveBeenCalledWith('/api/agent/stream', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Summarize this page',
        createdAt: '2026-06-01T10:00:00.000Z',
        pageSnapshot,
      }),
    });
    expect(onStreamMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: 'Hello world',
      }),
    );
    expect(messages).toEqual([
      expect.objectContaining({
        role: 'assistant',
        content: 'Hello world',
        createdAt: '2026-06-01T10:00:00.000Z',
      }),
    ]);
  });

  it('keeps demo transport when no agent API endpoint is configured', () => {
    expect(createConfiguredAgentTransport({ env: {} })).toBeUndefined();
  });

  it('creates API transport from configured agent endpoint', async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify([
            {
              id: 'assistant_api',
              role: 'assistant',
              createdAt: '2026-06-01T10:00:00.000Z',
              content: 'API response',
            },
          ]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
    );
    const transport = createConfiguredAgentTransport({
      fetcher,
      env: {
        VITE_OKTAVIUS_AGENT_API_URL: '/api/agent/turn',
      },
    });

    await expect(
      transport?.({
        content: 'Hello',
        createdAt: '2026-06-01T10:00:00.000Z',
        pageSnapshot,
      }),
    ).resolves.toEqual([
      {
        id: 'assistant_api',
        role: 'assistant',
        createdAt: '2026-06-01T10:00:00.000Z',
        content: 'API response',
      },
    ]);
  });
});
