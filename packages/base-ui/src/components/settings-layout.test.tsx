import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import {
  filterSettingsNavItems,
  groupSettingsNavItems,
  SettingsLayout,
  type SettingsNavItem,
  SettingsRow,
} from './settings-layout';

afterEach(() => {
  cleanup();
});

describe('SettingsRow inline alignment', () => {
  it('vertically centers the control by default', () => {
    const { container } = render(
      <SettingsRow label="Name">
        <input aria-label="name" />
      </SettingsRow>,
    );
    const row = container.firstElementChild as HTMLElement;
    expect(row.className).toContain('sm:items-center');
  });

  it('top-aligns the control when align is "start"', () => {
    const { container } = render(
      <SettingsRow label="IBAN" align="start">
        <input aria-label="iban" />
      </SettingsRow>,
    );
    const row = container.firstElementChild as HTMLElement;
    expect(row.className).toContain('sm:items-start');
    expect(row.className).not.toContain('sm:items-center');
  });

  it('ignores align when the row is stacked', () => {
    const { container } = render(
      <SettingsRow label="Footer" layout="stacked" align="start">
        <textarea aria-label="footer" />
      </SettingsRow>,
    );
    const row = container.firstElementChild as HTMLElement;
    expect(row.className).not.toContain('sm:items-start');
    expect(row.className).not.toContain('sm:items-center');
  });
});

const items: SettingsNavItem[] = [
  { key: 'a', label: 'Buttons', description: 'clickable', group: 'Foundations' },
  { key: 'b', label: 'Tables', description: 'data grid', group: 'Components' },
  { key: 'c', label: 'Kanban', description: 'board', group: 'Patterns' },
];

describe('filterSettingsNavItems', () => {
  it('matches label and description case-insensitively', () => {
    expect(filterSettingsNavItems(items, 'GRID').map((i) => i.key)).toEqual(['b']);
    expect(filterSettingsNavItems(items, '').map((i) => i.key)).toEqual(['a', 'b', 'c']);
  });
});

describe('groupSettingsNavItems', () => {
  it('orders groups by groupOrder, then appends any remaining', () => {
    const groups = groupSettingsNavItems(items, ['Components', 'Foundations']);
    expect(groups.map((g) => g.group)).toEqual(['Components', 'Foundations', 'Patterns']);
    expect(groups[0]?.items.map((i) => i.key)).toEqual(['b']);
  });

  it('places ungrouped items under a null bucket after the ordered groups', () => {
    const mixed: SettingsNavItem[] = [
      { key: 'a', label: 'A', group: 'X' },
      { key: 'b', label: 'B' },
    ];
    const groups = groupSettingsNavItems(mixed, ['X']);
    expect(groups.map((g) => g.group)).toEqual(['X', null]);
    expect(groups[1]?.items.map((i) => i.key)).toEqual(['b']);
  });
});

describe('SettingsLayout grouping + filter', () => {
  it('renders group headers when items carry a group', () => {
    render(
      <SettingsLayout
        items={items}
        activeKey="a"
        onSelect={() => {}}
        groupOrder={['Foundations', 'Components', 'Patterns']}
      >
        content
      </SettingsLayout>,
    );
    expect(screen.getByText('Foundations')).toBeInTheDocument();
    expect(screen.getByText('Patterns')).toBeInTheDocument();
  });

  it('filters items as the user types when filterable', async () => {
    const user = userEvent.setup();
    render(
      <SettingsLayout items={items} activeKey="a" onSelect={() => {}} filterable>
        content
      </SettingsLayout>,
    );
    const input = screen.getByPlaceholderText('Filter sections…');
    await user.type(input, 'kan');
    expect(screen.getAllByText('Kanban').length).toBeGreaterThan(0);
    expect(screen.queryByText('Buttons')).not.toBeInTheDocument();
  });

  it('renders a flat list with no filter input when neither group nor filterable is used', () => {
    const flat: SettingsNavItem[] = [
      { key: 'a', label: 'Alpha' },
      { key: 'b', label: 'Beta' },
    ];
    render(
      <SettingsLayout items={flat} activeKey="a" onSelect={() => {}}>
        content
      </SettingsLayout>,
    );
    expect(screen.queryByPlaceholderText('Filter sections…')).not.toBeInTheDocument();
    expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0);
  });

  it('renders ungrouped items without a group header', () => {
    const mixed: SettingsNavItem[] = [
      { key: 'a', label: 'Grouped', group: 'Foundations' },
      { key: 'b', label: 'Loose' },
    ];
    render(
      <SettingsLayout items={mixed} activeKey="a" onSelect={() => {}} groupOrder={['Foundations']}>
        content
      </SettingsLayout>,
    );
    expect(screen.getByText('Foundations')).toBeInTheDocument();
    expect(screen.getAllByText('Loose').length).toBeGreaterThan(0);
  });
});
