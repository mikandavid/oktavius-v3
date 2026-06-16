import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

import { SegmentedToggle } from './segmented-toggle';

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

describe('SegmentedToggle', () => {
  it('exposes a labelled radiogroup with one radio per option', () => {
    render(
      <SegmentedToggle ariaLabel="Theme" value="system" options={OPTIONS} onChange={() => {}} />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks the active option with aria-checked and the active surface class', () => {
    render(
      <SegmentedToggle ariaLabel="Theme" value="dark" options={OPTIONS} onChange={() => {}} />,
    );
    const dark = screen.getByRole('radio', { name: 'Dark' });
    expect(dark).toHaveAttribute('aria-checked', 'true');
    expect(dark.className).toContain('bg-card');
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the clicked value', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedToggle ariaLabel="Theme" value="system" options={OPTIONS} onChange={onChange} />,
    );
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Light' }));
    expect(onChange).toHaveBeenCalledWith('light');
  });

  it('moves selection with arrow keys (wrapping)', async () => {
    const onChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState<'light' | 'dark' | 'system'>('system');
      return (
        <SegmentedToggle
          ariaLabel="Theme"
          value={value}
          options={OPTIONS}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
        />
      );
    }
    render(<Controlled />);
    const user = userEvent.setup();
    screen.getByRole('radio', { name: 'System' }).focus();
    // System (index 2) + ArrowRight wraps past the end to Light (index 0).
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('light');
    // From Light, focus follows selection; ArrowLeft wraps before the start to System.
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('system');
  });

  it('moves DOM focus to the newly selected radio on arrow navigation', async () => {
    function Controlled() {
      const [value, setValue] = useState<'light' | 'dark' | 'system'>('system');
      return (
        <SegmentedToggle ariaLabel="Theme" value={value} options={OPTIONS} onChange={setValue} />
      );
    }
    render(<Controlled />);
    const user = userEvent.setup();
    screen.getByRole('radio', { name: 'System' }).focus();
    await user.keyboard('{ArrowRight}'); // wraps System -> Light
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveFocus();
  });

  it('uses option.ariaLabel for the accessible name when provided', () => {
    render(
      <SegmentedToggle
        ariaLabel="Language"
        value="en"
        options={[
          { value: 'de', label: 'DE', ariaLabel: 'Deutsch' },
          { value: 'en', label: 'EN', ariaLabel: 'English' },
        ]}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
  });
});
