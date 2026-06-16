import enSupport from '@oktavius/i18n/locales/en/support.json';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IssueRow } from './IssueRow';
import type { TicketRow } from './shared';

// Resolve the real English support strings so aria-label assertions match.
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

const row: TicketRow = {
  id: 'abc123def456',
  orgId: 'o1',
  orgName: 'Org',
  userId: 'u1',
  userEmail: 'a@b.c',
  userName: 'Anna',
  subject: 'Login broken',
  message: 'fails',
  category: 'bug',
  status: 'open',
  priority: 'urgent',
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
  requester: 'Anna',
  statusLabel: 'Open',
  priorityLabel: 'Urgent',
  categoryLabel: 'Bug',
  statusGroup: 'open',
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

describe('IssueRow', () => {
  it('renders subject, short id, requester and pills, and fires onClick', () => {
    let clicked = '';
    act(() => {
      root.render(<IssueRow row={row} onClick={(id) => (clicked = id)} />);
    });
    expect(container.textContent).toContain('Login broken');
    expect(container.textContent).toContain('#abc123'); // first 6 of uuid
    expect(container.textContent).toContain('Anna');
    expect(container.textContent).toContain('Urgent');
    expect(container.textContent).toContain('Bug');

    const clickable = container.querySelector('[role="button"], button') as HTMLElement;
    act(() => clickable.click());
    expect(clicked).toBe('abc123def456');
  });

  it('shows an unread indicator when unread', () => {
    act(() => {
      root.render(<IssueRow row={row} onClick={() => {}} unread />);
    });
    const dot = container.querySelector('[aria-label="Unread activity"]');
    expect(dot).not.toBeNull();
  });

  it('omits the unread indicator when read', () => {
    act(() => {
      root.render(<IssueRow row={row} onClick={() => {}} unread={false} />);
    });
    const dot = container.querySelector('[aria-label="Unread activity"]');
    expect(dot).toBeNull();
  });
});
