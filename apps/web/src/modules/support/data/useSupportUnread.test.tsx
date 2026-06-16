// useSupportUnread.test.tsx
// Note: @testing-library/react is not installed in this repo.
// We use the project-standard pattern: createRoot + act from react-dom/client.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useSupportUnread } from './useSupportUnread';

let container: HTMLDivElement;
let root: Root;

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  localStorage.clear();
});

describe('useSupportUnread', () => {
  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  it('treats never-seen tickets as unread', () => {
    let captured: ReturnType<typeof useSupportUnread> | undefined;

    function Harness() {
      captured = useSupportUnread();
      return null;
    }

    act(() => {
      root.render(<Harness />);
    });

    expect(captured!.isUnread({ id: 't1', updatedAt: '2026-06-16T10:00:00Z' })).toBe(true);
  });

  it('markSeen clears unread for that ticket', () => {
    let captured: ReturnType<typeof useSupportUnread> | undefined;

    function Harness() {
      captured = useSupportUnread();
      return null;
    }

    act(() => {
      root.render(<Harness />);
    });

    act(() => captured!.markSeen('t1', '2026-06-16T10:00:00Z'));

    expect(captured!.isUnread({ id: 't1', updatedAt: '2026-06-16T10:00:00Z' })).toBe(false);
  });

  it('re-flags unread when the ticket updates after last seen', () => {
    let captured: ReturnType<typeof useSupportUnread> | undefined;

    function Harness() {
      captured = useSupportUnread();
      return null;
    }

    act(() => {
      root.render(<Harness />);
    });

    act(() => captured!.markSeen('t1', '2026-06-16T10:00:00Z'));
    expect(captured!.isUnread({ id: 't1', updatedAt: '2026-06-16T12:00:00Z' })).toBe(true);
  });

  it('fresh mount reads persisted value from localStorage', () => {
    // First mount: mark t1 as seen
    let captured: ReturnType<typeof useSupportUnread> | undefined;

    function Harness() {
      captured = useSupportUnread();
      return null;
    }

    act(() => {
      root.render(<Harness />);
    });
    act(() => captured!.markSeen('t1', '2026-06-16T10:00:00Z'));

    // Unmount the first root without clearing localStorage
    act(() => {
      root.unmount();
    });

    // Fresh mount in a new container — the lazy read() initializer should pick up the persisted value
    const container2 = document.createElement('div');
    document.body.appendChild(container2);
    const root2 = createRoot(container2);
    let captured2: ReturnType<typeof useSupportUnread> | undefined;

    function Harness2() {
      captured2 = useSupportUnread();
      return null;
    }

    act(() => {
      root2.render(<Harness2 />);
    });

    expect(captured2!.isUnread({ id: 't1', updatedAt: '2026-06-16T10:00:00Z' })).toBe(false);

    // Teardown the second root (afterEach handles root/container for the first)
    act(() => {
      root2.unmount();
    });
    container2.remove();
  });
});
