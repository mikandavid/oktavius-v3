import enSupport from '@oktavius/i18n/locales/en/support.json';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AutomationPanel } from './AutomationPanel';
import type { SupportTicket } from './data/types';

// Resolve the real English support strings so literal-string assertions match.
const support = enSupport as Record<string, string>;
vi.mock('@/core/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const inner = key.startsWith('support.') ? key.slice('support.'.length) : key;
      return support[inner] ?? key;
    },
    language: 'en',
  }),
}));

const baseTicket: SupportTicket = {
  id: 't1',
  orgId: 'o1',
  orgName: 'Org',
  userId: 'u1',
  userEmail: 'a@b.c',
  userName: 'Anna',
  subject: 'Login broken',
  message: 'fails',
  category: 'bug',
  status: 'open',
  priority: 'normal',
  tags: [],
  source: 'web',
  resolutionMessage: null,
  resolvedAt: null,
  resolvedBy: null,
  assigneeUserId: null,
  assigneeName: null,
  automationStatus: null,
  automationPrUrl: null,
  automationBranchName: null,
  automationWorkflowRunUrl: null,
  automationError: null,
  currentPageUrl: null,
  agentConversationId: null,
  createdAt: '2026-06-16T00:00:00Z',
  updatedAt: '2026-06-16T00:00:00Z',
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
});

describe('AutomationPanel', () => {
  it('renders nothing when automationStatus is null', () => {
    act(() => {
      root.render(<AutomationPanel ticket={{ ...baseTicket, automationStatus: null }} />);
    });
    expect(container.innerHTML).toBe('');
  });

  it("renders nothing when automationStatus is 'not_requested'", () => {
    act(() => {
      root.render(
        <AutomationPanel ticket={{ ...baseTicket, automationStatus: 'not_requested' }} />,
      );
    });
    expect(container.innerHTML).toBe('');
  });

  it("shows status label and PR link when automationStatus is 'pr_created'", () => {
    act(() => {
      root.render(
        <AutomationPanel
          ticket={{
            ...baseTicket,
            automationStatus: 'pr_created',
            automationPrUrl: 'https://gh/pr/1',
          }}
        />,
      );
    });

    expect(container.textContent).toContain('PR created');

    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('a'));
    const prLink = links.find((a) => a.href === 'https://gh/pr/1');
    expect(prLink).toBeDefined();
    expect(prLink!.textContent?.trim()).toMatch(/View pull request/);
  });

  it("renders error message with text-destructive class when status is 'failed'", () => {
    act(() => {
      root.render(
        <AutomationPanel
          ticket={{
            ...baseTicket,
            automationStatus: 'failed',
            automationError: 'Deploy failed',
          }}
        />,
      );
    });

    const errorEl = container.querySelector('p');
    expect(errorEl).toBeDefined();
    expect(errorEl!.textContent).toContain('Deploy failed');
    expect(errorEl!.className).toContain('text-destructive');
  });

  it('renders two anchors with correct hrefs when both PR and workflow run URLs are set', () => {
    act(() => {
      root.render(
        <AutomationPanel
          ticket={{
            ...baseTicket,
            automationStatus: 'pr_created',
            automationPrUrl: 'https://gh/pr/42',
            automationWorkflowRunUrl: 'https://gh/actions/run/99',
          }}
        />,
      );
    });

    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('a'));
    expect(links).toHaveLength(2);

    const prLink = links.find((a) => a.href === 'https://gh/pr/42');
    expect(prLink).toBeDefined();
    expect(prLink!.textContent?.trim()).toMatch(/View pull request/);

    const runLink = links.find((a) => a.href === 'https://gh/actions/run/99');
    expect(runLink).toBeDefined();
    expect(runLink!.textContent?.trim()).toMatch(/View workflow run/);
  });
});
