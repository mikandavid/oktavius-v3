import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CalendarMiniPicker } from './calendar-mini-picker';
import {
  MINI_CALENDAR_CLASS_NAMES,
  MINI_CALENDAR_FORBIDDEN_NAV_PATTERNS,
} from './calendar-mini-picker-styles';

describe('MINI_CALENDAR_CLASS_NAMES', () => {
  it('keeps 7-column grid on weekdays and week rows', () => {
    expect(MINI_CALENDAR_CLASS_NAMES.weekdays).toContain('grid-cols-7');
    expect(MINI_CALENDAR_CLASS_NAMES.week).toContain('grid-cols-7');
  });

  it('uses in-flow nav layout', () => {
    expect(MINI_CALENDAR_CLASS_NAMES.nav).toContain('flex');
    for (const forbidden of MINI_CALENDAR_FORBIDDEN_NAV_PATTERNS) {
      expect(MINI_CALENDAR_CLASS_NAMES.nav).not.toContain(forbidden);
    }
  });

  it('pairs selected fill and text tokens', () => {
    expect(MINI_CALENDAR_CLASS_NAMES.selected).toContain('bg-cta');
    expect(MINI_CALENDAR_CLASS_NAMES.selected).toContain('text-cta-foreground');
  });
});

describe('CalendarMiniPicker', () => {
  function getRoot(container: HTMLElement) {
    return container.querySelector('.rdp-root') as HTMLElement;
  }

  it('renders month navigation and grid', () => {
    const { container } = render(
      <CalendarMiniPicker selected={new Date(2026, 5, 15)} onSelect={() => undefined} />,
    );
    const root = getRoot(container);

    expect(within(root).getByRole('navigation')).toBeInTheDocument();
    expect(within(root).getByRole('button', { name: /previous month/i })).toBeInTheDocument();
    expect(within(root).getByRole('button', { name: /next month/i })).toBeInTheDocument();
    expect(within(root).getByRole('grid')).toBeInTheDocument();
    expect(within(root).getByText('June 2026')).toBeInTheDocument();
  });

  it('advances month when next is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CalendarMiniPicker selected={new Date(2026, 5, 15)} onSelect={() => undefined} />,
    );
    const root = getRoot(container);

    await user.click(within(root).getByRole('button', { name: /next month/i }));

    expect(within(root).getByText('July 2026')).toBeInTheDocument();
  });

  it('calls onSelect when a day is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <CalendarMiniPicker selected={new Date(2026, 5, 1)} onSelect={onSelect} />,
    );
    const root = getRoot(container);

    await user.click(within(root).getByRole('button', { name: /june 15/i }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]?.getDate()).toBe(15);
  });

  it('applies grid layout classes in the DOM', () => {
    const { container } = render(
      <CalendarMiniPicker selected={new Date(2026, 5, 15)} onSelect={() => undefined} />,
    );
    const root = getRoot(container);
    const grid = root.querySelector('[role="grid"]') as HTMLTableElement;

    // react-day-picker v9 applies custom classNames on <tr> rows (defaults are replaced, not merged).
    expect(grid.querySelector('thead tr')?.className).toMatch(/grid-cols-7/);
    expect(grid.querySelector('tbody tr')?.className).toMatch(/grid-cols-7/);
    expect(within(root).getByRole('button', { name: /previous month/i }).className).not.toMatch(
      /\babsolute\b/,
    );
  });
});
