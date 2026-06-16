import type { AgentPageContextSnapshot } from './page-routing';
import type { AgentMessage, AgentModelMode } from './types';

export type AgentRuntimeRequest = {
  content: string;
  createdAt: string;
  pageSnapshot: AgentPageContextSnapshot;
  modelMode?: AgentModelMode;
  webSearch?: boolean;
  memory?: boolean;
  onStreamMessage?: (message: AgentMessage) => void;
};

export type AgentRuntimeTransport = (
  request: AgentRuntimeRequest,
) => Promise<AgentMessage[]> | AgentMessage[];

export type AgentRuntimeFetcher = (
  input: string,
  init: {
    method: 'POST';
    headers?: Record<string, string>;
    body: string;
  },
) => Promise<Response>;

export type AgentRuntimeEnvironment = {
  VITE_OKTAVIUS_AGENT_API_URL?: string;
  VITE_OKTAVIUS_API_TOKEN?: string;
};

type RunAgentTurnOptions = AgentRuntimeRequest & {
  transport?: AgentRuntimeTransport;
};

function appendPageContext(messages: AgentMessage[], pageSnapshot: AgentPageContextSnapshot) {
  if (!pageSnapshot.moduleLabel || messages[0]?.role !== 'assistant') return messages;

  return messages.map((message, index) =>
    index === 0
      ? {
          ...message,
          content: `${message.content ?? ''}\n\n_Context: ${pageSnapshot.moduleLabel}${
            pageSnapshot.routeLabel ? ` · ${pageSnapshot.routeLabel}` : ''
          }_`.trim(),
        }
      : message,
  );
}

function getDefaultFetcher(): AgentRuntimeFetcher {
  if (typeof fetch !== 'function') {
    throw new Error('No fetch implementation is available for API-backed agent runtime.');
  }

  return (input, init) => fetch(input, init);
}

function isAgentMessage(value: unknown): value is AgentMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AgentMessage>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.role === 'string' &&
    typeof candidate.createdAt === 'string'
  );
}

function parseAgentMessages(payload: unknown): AgentMessage[] {
  if (Array.isArray(payload)) return payload.filter(isAgentMessage);
  if (isAgentMessage(payload)) return [payload];
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { messages?: unknown }).messages)
  ) {
    return (payload as { messages: unknown[] }).messages.filter(isAgentMessage);
  }
  return [];
}

function parseStreamPayload(line: string): Record<string, unknown> | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed === 'data: [DONE]') return null;
  const body = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
  if (!body || body === '[DONE]') return null;

  try {
    const parsed = JSON.parse(body) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return { type: 'delta', delta: body };
  }
}

function deltaFromPayload(payload: Record<string, unknown>) {
  const delta = payload.delta ?? payload.content ?? payload.text;
  return typeof delta === 'string' ? delta : '';
}

async function readStreamedAgentMessages({
  response,
  createdAt,
  onStreamMessage,
}: {
  response: Response;
  createdAt: string;
  onStreamMessage?: (message: AgentMessage) => void;
}) {
  const reader = response.body?.getReader();
  if (!reader) return [];

  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let finalMessages: AgentMessage[] = [];
  const streamedMessage = (): AgentMessage => ({
    id: `assistant_stream_${createdAt}`,
    role: 'assistant',
    createdAt,
    content,
  });

  const handleLine = (line: string) => {
    const payload = parseStreamPayload(line);
    if (!payload) return;

    const messages = parseAgentMessages(payload);
    if (messages.length > 0) {
      finalMessages = messages;
      return;
    }

    const delta = deltaFromPayload(payload);
    if (!delta) return;
    content += delta;
    onStreamMessage?.(streamedMessage());
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) handleLine(line);
  }

  buffer += decoder.decode();
  if (buffer) handleLine(buffer);

  if (finalMessages.length > 0) return finalMessages;
  return content ? [streamedMessage()] : [];
}

export function createApiAgentTransport({
  endpoint,
  token,
  fetcher,
}: {
  endpoint: string;
  token?: string;
  fetcher?: AgentRuntimeFetcher;
}): AgentRuntimeTransport {
  return async ({
    content,
    createdAt,
    pageSnapshot,
    modelMode,
    webSearch,
    memory,
    onStreamMessage,
  }) => {
    const resolvedFetcher = fetcher ?? getDefaultFetcher();
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    };
    const response = await resolvedFetcher(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content, createdAt, pageSnapshot, modelMode, webSearch, memory }),
    });

    if (!response.ok) {
      throw new Error(
        `POST ${endpoint} failed with ${response.status} ${response.statusText}`.trim(),
      );
    }

    const contentType = response.headers.get('Content-Type') ?? '';
    if (response.body && !contentType.includes('application/json')) {
      return readStreamedAgentMessages({ response, createdAt, onStreamMessage });
    }

    const payload = (await response.json()) as unknown;
    return parseAgentMessages(payload);
  };
}

export function createConfiguredAgentTransport({
  env,
  fetcher,
}: {
  env: AgentRuntimeEnvironment;
  fetcher?: AgentRuntimeFetcher;
}): AgentRuntimeTransport | undefined {
  const endpoint = env.VITE_OKTAVIUS_AGENT_API_URL?.trim();
  if (!endpoint) return undefined;

  const token = env.VITE_OKTAVIUS_API_TOKEN?.trim();
  return createApiAgentTransport({
    endpoint,
    fetcher,
    ...(token ? { token } : {}),
  });
}

export async function runAgentTurn({
  content,
  createdAt,
  pageSnapshot,
  onStreamMessage,
  transport,
}: RunAgentTurnOptions): Promise<AgentMessage[]> {
  if (transport) {
    return transport({ content, createdAt, pageSnapshot, onStreamMessage });
  }

  void content;

  return appendPageContext(
    [
      {
        id: `assistant_unconfigured_${createdAt}`,
        role: 'assistant',
        createdAt,
        content: 'Agent runtime is not configured.',
      },
    ],
    pageSnapshot,
  );
}
