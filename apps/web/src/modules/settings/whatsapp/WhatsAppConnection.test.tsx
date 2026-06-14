import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import type { OsirisWhatsAppStatus } from './data/whatsappClient';
import { whatsappKeys } from './data/whatsappKeys';

vi.mock('./data/whatsappClient', () => ({
  createOsirisWhatsAppClient: () => ({ getStatus: vi.fn() }),
}));
vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => ({ activeOrgId: 'org_1' }),
}));

import { WhatsAppConnection } from './WhatsAppConnection';

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  queryClient.clear();
  vi.clearAllMocks();
});

// Pre-seed the query cache so useWhatsAppStatus resolves synchronously on first
// render (staleTime: Infinity prevents a background refetch). This keeps the
// createRoot + act harness deterministic without juggling react-query's timers.
async function renderPanel(status: OsirisWhatsAppStatus) {
  queryClient.setQueryData(whatsappKeys.status('org_1'), status);
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <TestI18nProvider>
          <WhatsAppConnection />
        </TestI18nProvider>
      </QueryClientProvider>,
    );
  });
}

describe('WhatsAppConnection', () => {
  it('shows the connected phone number and formatted uptime', async () => {
    await renderPanel({
      status: 'connected',
      phoneNumber: '+431234567',
      connectedAt: 't',
      uptime: 3720,
    });

    expect(container.textContent).toContain('+431234567');
    expect(container.textContent).toContain('1h 2m');
  });

  it('shows the pairing hint when disconnected', async () => {
    await renderPanel({
      status: 'disconnected',
      phoneNumber: null,
      connectedAt: null,
      uptime: null,
    });

    expect(container.textContent).not.toContain('+');
    expect(container.querySelector('[data-testid="wa-pairing-hint"]')).not.toBeNull();
  });
});
