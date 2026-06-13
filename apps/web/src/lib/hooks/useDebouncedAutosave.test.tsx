import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedAutosave } from './useDebouncedAutosave';

function Harness(props: { value: number; enabled: boolean; onSave: (value: number) => void }) {
  useDebouncedAutosave(props.value, {
    onSave: props.onSave,
    enabled: props.enabled,
    delayMs: 1000,
  });
  return null;
}

describe('useDebouncedAutosave', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does not save while disabled', () => {
    const onSave = vi.fn();
    act(() => root.render(<Harness value={1} enabled={false} onSave={onSave} />));
    act(() => root.render(<Harness value={2} enabled={false} onSave={onSave} />));
    act(() => vi.advanceTimersByTime(2000));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves the latest value once the debounce settles', () => {
    const onSave = vi.fn();
    act(() => root.render(<Harness value={1} enabled onSave={onSave} />));
    act(() => root.render(<Harness value={2} enabled onSave={onSave} />));
    act(() => root.render(<Harness value={3} enabled onSave={onSave} />));
    expect(onSave).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1000));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(3);
  });

  it('cancels a pending save on unmount', () => {
    const onSave = vi.fn();
    act(() => root.render(<Harness value={1} enabled onSave={onSave} />));
    act(() => root.unmount());
    act(() => vi.advanceTimersByTime(2000));
    expect(onSave).not.toHaveBeenCalled();
    // re-mount so afterEach unmount is safe
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });
});
