import type { ReactNode } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AgentPageContextProvider } from '@/components/agent/page-context';

import { EntityDetailWorkspaceTabs } from './EntityDetailWorkspaceTabs';

vi.mock('@/components/layout/OsirisChatShell', () => ({
  OsirisChatShell: ({ mode }: { mode: string }) => (
    <div data-testid="chat-shell" data-mode={mode}>
      Scoped chat
    </div>
  ),
}));

vi.mock('@/lib/org-profiles/useOrgProfile', () => ({
  useOrgProfile: () => ({
    id: 'org_apex',
    slug: 'apex',
    name: 'Apex',
    industryKey: 'generic',
    enabledModules: ['clients'],
    terminology: {
      cases: 'Cases',
      casesSingular: 'Case',
      clients: 'Clients',
      clientsSingular: 'Client',
      products: 'Products',
      orders: 'Orders',
      projects: 'Projects',
      documents: 'Documents',
      dashboard: 'Dashboard',
    },
    locations: [],
    tagline: 'Sandbox tenant',
  }),
}));

function renderWithProviders(node: ReactNode) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/clients/client_1?tab=assistant']}>
      <AgentPageContextProvider>{node}</AgentPageContextProvider>
    </MemoryRouter>,
  );
}

describe('EntityDetailWorkspaceTabs assistant panel', () => {
  it('renders a module-scoped assistant tab by default', () => {
    const markup = renderWithProviders(
      <EntityDetailWorkspaceTabs
        overview={<div>Overview content</div>}
        entityType="client"
        entityId="client_1"
        activeTab="assistant"
        onTabChange={() => undefined}
      />,
    );

    expect(markup).toContain('Assistant');
    expect(markup).toContain('Scoped chat');
    expect(markup).toContain('data-mode="module"');
  });

  it('can hide the assistant tab for detail surfaces that should not embed chat', () => {
    const markup = renderWithProviders(
      <EntityDetailWorkspaceTabs
        overview={<div>Overview content</div>}
        entityType="client"
        entityId="client_1"
        activeTab="overview"
        onTabChange={() => undefined}
        showAssistant={false}
      />,
    );

    expect(markup).not.toContain('Scoped chat');
  });
});

function renderInteractiveTabs(entityId = 'contact_1') {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  const renderTabs = (nextEntityId = entityId) => {
    root.render(
      <MemoryRouter initialEntries={['/contacts/contact_1']}>
        <AgentPageContextProvider>
          <EntityDetailWorkspaceTabs
            overview={<div>Overview content</div>}
            entityType="contact"
            entityId={nextEntityId}
            activeTab="overview"
            onTabChange={() => undefined}
            showActivity={false}
            showAssistant={false}
          />
        </AgentPageContextProvider>
      </MemoryRouter>,
    );
  };

  act(() => {
    renderTabs(entityId);
  });

  return { container, root, renderTabs };
}

describe('EntityDetailWorkspaceTabs switching', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
  });

  it('switches tabs locally when a legacy caller passes a fixed active tab', () => {
    const rendered = renderInteractiveTabs();
    roots.push(rendered.root);

    expect(rendered.container.textContent).toContain('Overview content');

    const filesButton = Array.from(rendered.container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Files',
    );
    if (!filesButton) throw new Error('Expected Files tab trigger to render.');

    act(() => {
      filesButton.click();
    });

    expect(filesButton.getAttribute('data-state')).toBe('active');
  });

  it('resets local tab state when the entity changes under a fixed active tab', () => {
    const rendered = renderInteractiveTabs();
    roots.push(rendered.root);

    const filesButton = Array.from(rendered.container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Files',
    );
    if (!filesButton) throw new Error('Expected Files tab trigger to render.');

    act(() => {
      filesButton.click();
    });

    expect(filesButton.getAttribute('data-state')).toBe('active');

    act(() => {
      rendered.renderTabs('contact_2');
    });

    const overviewButton = Array.from(rendered.container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Overview',
    );
    if (!overviewButton) throw new Error('Expected Overview tab trigger to render.');

    expect(overviewButton.getAttribute('data-state')).toBe('active');
  });
});
