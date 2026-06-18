import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Combobox } from './combobox';

const OPTIONS = [
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'es', label: 'Spain' },
];

function renderCombobox(props: Partial<React.ComponentProps<typeof Combobox>> = {}) {
  const onChange = vi.fn();
  render(
    <>
      <Combobox options={OPTIONS} onChange={onChange} placeholder="Pick a country" {...props} />
      <button type="button">outside</button>
    </>,
  );
  return { onChange };
}

describe('Combobox (editable typeahead)', () => {
  it('filters options as the user types in the field', async () => {
    const user = userEvent.setup();
    renderCombobox();
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'fra');

    expect(screen.getByRole('option', { name: /france/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /germany/i })).not.toBeInTheDocument();
  });

  it('highlights options with arrow keys and selects on Enter', async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox();
    await user.click(screen.getByRole('combobox'));
    // active starts at Germany (index 0); ArrowDown -> France, Enter selects it
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('fr');
  });

  it('shows all options (not filtered to the current value) when focusing a filled field', async () => {
    const user = userEvent.setup();
    renderCombobox({ value: 'de' });
    expect(screen.getByRole('combobox')).toHaveValue('Germany');

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: /germany/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /france/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /spain/i })).toBeInTheDocument();
  });

  it('reverts the field text to the selected label on Escape', async () => {
    const user = userEvent.setup();
    renderCombobox({ value: 'de' });
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'zzz');
    await user.keyboard('{Escape}');

    expect(field).toHaveValue('Germany');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('reverts the field text when clicking outside without selecting', async () => {
    const user = userEvent.setup();
    renderCombobox({ value: 'de' });
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'zzz');
    await user.click(screen.getByText('outside'));

    await waitFor(() => expect(field).toHaveValue('Germany'));
  });

  it('clears the value via the clear button', async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox({ value: 'de' });
    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('renders async results after debounce', async () => {
    const user = userEvent.setup();
    const asyncItems = vi.fn(async (q: string) => [{ value: 'x', label: `Remote ${q}` }]);
    renderCombobox({ options: [], asyncItems });
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'ab');

    await waitFor(() =>
      expect(screen.getByRole('option', { name: /remote ab/i })).toBeInTheDocument(),
    );
  });

  it('prefills the create field with the typed text', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => 'new-id');
    renderCombobox({ onCreate: { label: 'Create new', onSubmit } });
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'Acme');
    await user.click(screen.getByRole('button', { name: /create new/i }));

    expect(await screen.findByDisplayValue('Acme')).toBeInTheDocument();
  });
});
