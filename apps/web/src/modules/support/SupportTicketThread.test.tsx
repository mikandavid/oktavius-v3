import enSupport from '@oktavius/i18n/locales/en/support.json';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SupportTicketThread } from './SupportTicketThread';

// The real Switch is a Radix switch driven by pointer events, which jsdom does
// not implement, so we replace ONLY Switch with a faithful checkbox-like
// stand-in that calls the same `onCheckedChange(checked)` callback on click.
// Everything else (Button, Textarea) stays real via importActual.
interface MockSwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  'aria-label'?: string;
}
vi.mock('@oktavius/base-ui', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@oktavius/base-ui');
  function MockSwitch({ checked = false, onCheckedChange, ...rest }: MockSwitchProps) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={rest['aria-label']}
        data-switch
        onClick={() => onCheckedChange?.(!checked)}
      />
    );
  }
  return { ...actual, Switch: MockSwitch };
});

const comments = [
  {
    id: 'c1',
    ticketId: 't1',
    userId: 'u1',
    userName: 'Public User',
    userEmail: 'pub@x.io',
    message: 'public reply',
    isInternal: false,
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z',
  },
  {
    id: 'c2',
    ticketId: 't1',
    userId: 'u2',
    userName: 'Admin User',
    userEmail: 'admin@x.io',
    message: 'secret note',
    isInternal: true,
    createdAt: '2026-06-16T11:00:00.000Z',
    updatedAt: '2026-06-16T11:00:00.000Z',
  },
];

const addComment = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false };

vi.mock('./data/useSupportData', () => ({
  useSupportComments: () => ({ data: comments }),
  useSupportMutations: () => ({ addComment }),
}));

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

const ticket = {
  id: 't1',
  userName: 'Requester',
  userEmail: 'req@x.io',
  message: 'initial request body',
  createdAt: '2026-06-16T09:00:00.000Z',
} as never;

let container: HTMLDivElement;
let root: Root;

function findByText(text: string): HTMLElement | null {
  const nodes = Array.from(document.body.querySelectorAll<HTMLElement>('*'));
  return nodes.find((n) => n.textContent?.trim() === text) ?? null;
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  addComment.mutateAsync.mockClear();
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
});

describe('SupportTicketThread', () => {
  it('hides internal notes from non-admins but shows public replies', () => {
    act(() => {
      root.render(<SupportTicketThread ticket={ticket} />);
    });
    expect(document.body.textContent).toContain('public reply');
    expect(document.body.textContent).not.toContain('secret note');
  });

  it('shows internal notes with an Internal badge for admins', () => {
    act(() => {
      root.render(<SupportTicketThread ticket={ticket} admin />);
    });
    expect(document.body.textContent).toContain('public reply');
    expect(document.body.textContent).toContain('secret note');
    expect(findByText('Internal')).not.toBeNull();
  });

  it('admin: toggling Internal note, typing, and sending posts isInternal:true', async () => {
    act(() => {
      root.render(<SupportTicketThread ticket={ticket} admin />);
    });

    // Turn on the internal-note toggle.
    const toggle = document.body.querySelector('[data-switch]') as HTMLButtonElement | null;
    expect(toggle).not.toBeNull();
    act(() => toggle!.click());

    // Type into the composer textarea.
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement | null;
    expect(textarea).not.toBeNull();
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value',
    )!.set!;
    act(() => {
      nativeSetter.call(textarea, 'a private comment');
      textarea!.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Click Send.
    const sendBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Send Reply',
    );
    expect(sendBtn).toBeDefined();
    await act(async () => {
      sendBtn!.click();
    });

    expect(addComment.mutateAsync).toHaveBeenCalledWith({
      ticketId: 't1',
      message: 'a private comment',
      isInternal: true,
    });
  });
});
