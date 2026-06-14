import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

const getStatus = vi.fn();

vi.mock('./data/whatsappClient', () => ({
  createOsirisWhatsAppClient: () => ({ getStatus }),
}));
vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => ({ activeOrgId: 'org_1' }),
}));

import { WhatsAppConnection } from './WhatsAppConnection';

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

async function renderPanel() {
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <TestI18nProvider>
          <WhatsAppConnection />
        </TestI18nProvider>
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await Promise.resolve();
  });
}

describe('WhatsAppConnection', () => {
  it('shows the connected phone number and formatted uptime', async () => {
    getStatus.mockResolvedValue({
      status: 'connected',
      phoneNumber: '+431234567',
      connectedAt: 't',
      uptime: 3720,
    });

    await renderPanel();

    expect(container.textContent).toContain('+431234567');
    expect(container.textContent).toContain('1h 2m');
  });

  it('shows the pairing hint when disconnected', async () => {
    getStatus.mockResolvedValue({
      status: 'disconnected',
      phoneNumber: null,
      connectedAt: null,
      uptime: null,
    });

    await renderPanel();

    expect(container.textContent).not.toContain('+');
    expect(container.querySelector('[data-testid="wa-pairing-hint"]')).not.toBeNull();
  });
});
