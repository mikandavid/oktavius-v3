import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import type { OsirisWhatsAppConfig, OsirisWhatsAppContact } from './data/whatsappClient';
import { whatsappKeys } from './data/whatsappKeys';

vi.mock('./data/whatsappClient', () => ({
  createOsirisWhatsAppClient: () => ({
    getConfig: vi.fn(),
    updateConfig: vi.fn(),
    listContacts: vi.fn(),
    addContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
  }),
}));
vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => ({
    activeOrgId: 'org_1',
    listOrgMembers: vi.fn().mockResolvedValue([]),
  }),
}));

import { WhatsAppContactsConfig } from './WhatsAppContactsConfig';

const CONFIG: OsirisWhatsAppConfig = {
  orgId: 'org_1',
  autoReply: true,
  dmPolicy: 'allowlist',
  groupPolicy: 'disabled',
};

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

async function renderConfig(contacts: OsirisWhatsAppContact[]) {
  queryClient.setQueryData(whatsappKeys.config('org_1'), CONFIG);
  queryClient.setQueryData(whatsappKeys.contacts('org_1'), { contacts });
  queryClient.setQueryData(whatsappKeys.members('org_1'), []);
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <TestI18nProvider>
          <WhatsAppContactsConfig />
        </TestI18nProvider>
      </QueryClientProvider>,
    );
  });
}

describe('WhatsAppContactsConfig', () => {
  it('renders an empty allowlist state', async () => {
    await renderConfig([]);

    expect(container.querySelector('[data-testid="wa-contacts-empty"]')).not.toBeNull();
  });

  it('lists contacts with their role badge', async () => {
    await renderConfig([
      {
        id: 'c1',
        orgId: 'org_1',
        phoneNumber: '+4311111',
        displayName: 'Max Mustermann',
        contactType: 'individual',
        groupJid: null,
        autoReply: true,
        userId: null,
        waRole: 'member',
        createdBy: null,
        createdAt: 'a',
        updatedAt: 'b',
      },
    ]);

    expect(container.textContent).toContain('Max Mustermann');
    expect(container.textContent).toContain('+4311111');
  });
});
