import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MultiSelect } from './multi-select';

const options = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
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
});
