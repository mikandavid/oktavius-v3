// OrgAgentIntegrationsPanel.test.tsx
// Note: @testing-library/react is not installed in this repo.
// We use the project-standard pattern: createRoot + act from react-dom/client.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { OrgAgentIntegrationsPanel } from './OrgAgentIntegrationsPanel';

let container: HTMLDivElement;
let root: Root;

describe('OrgAgentIntegrationsPanel', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it('renders a connection by displayName', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/connections')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                connections: [
                  {
                    id: 'c1',
                    provider: 'pipedream',
                    appKey: 'slack',
                    handle: 'slack-handle',
                    displayName: 'Slack',
                    ownerUserId: 'u1',
                    visibility: 'private',
                    permissionMode: 'read',
                    status: 'connected',
                    health: {},
                    isOwner: true,
                    canManage: true,
                    grants: [],
                    connectedAt: null,
                    updatedAt: new Date().toISOString(),
                  },
                ],
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            ),
          );
        }
        // All other fetch calls (provider-diagnostics, integrations, logos, etc.) return empty
        return Promise.resolve(
          new Response(
            JSON.stringify({
              integrations: [],
              apps: [],
              pipedream: { enabled: false, configured: false, environment: null, projectId: null },
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        );
      }),
    );

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await act(async () => {
      root.render(
        <TestI18nProvider>
          <QueryClientProvider client={qc}>
            <OrgAgentIntegrationsPanel />
          </QueryClientProvider>
        </TestI18nProvider>,
      );
    });

    // Wait for async queries to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(container.textContent).toContain('Slack');
  });
});
