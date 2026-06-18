import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MultiSelect } from './multi-select';

const options = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
  { value: 'gamma', label: 'Gamma' },
];

describe('MultiSelect', () => {
  it('uses semantic buttons for selected item removal without opening the popover', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<MultiSelect options={options} value={['alpha']} onChange={onChange} />);

    const removeButton = screen.getByRole('button', { name: 'Remove Alpha' });

    expect(screen.queryByPlaceholderText('Search…')).not.toBeInTheDocument();

    await user.click(removeButton);

    expect(onChange).toHaveBeenCalledWith([]);
    expect(screen.queryByPlaceholderText('Search…')).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('filters options as the user types in the field', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} value={[]} onChange={vi.fn()} />);
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'gam');

    expect(screen.getByRole('option', { name: /gamma/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /alpha/i })).not.toBeInTheDocument();
  });

  it('toggles the active option with arrow keys + Enter and keeps the dropdown open', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={options} value={[]} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    // active starts at Alpha (index 0); ArrowDown -> Beta, Enter toggles it
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith(['beta']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('clears the query after selecting an option', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} value={[]} onChange={vi.fn()} />);
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'al');
    expect(field).toHaveValue('al');

    await user.click(screen.getByRole('option', { name: /alpha/i }));
    expect(field).toHaveValue('');
  });

  it('removes the last chip on Backspace when the input is empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={options} value={['alpha', 'beta']} onChange={onChange} />);
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith(['alpha']);
  });

  it('clears all selections via the footer Clear button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={options} value={['alpha', 'beta']} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows all options when opened regardless of current selection', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} value={['alpha']} onChange={vi.fn()} />);
    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('option', { name: /alpha/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /beta/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /gamma/i })).toBeInTheDocument();
  });
});
