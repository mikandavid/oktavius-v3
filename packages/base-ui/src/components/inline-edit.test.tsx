import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { InlineEdit } from './inline-edit';

describe('InlineEdit', () => {
  it('edits select values with generated option labels', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <InlineEdit
        value="Draft"
        displayValue="Draft invoice"
        type="select"
        options={[
          { value: 'Draft', label: 'Draft invoice' },
          { value: 'Paid', label: 'Paid invoice' },
        ]}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole('button', { name: /draft invoice/i }));
    await user.selectOptions(screen.getByRole('combobox'), 'Paid');

    expect(onSave).toHaveBeenCalledWith('Paid');
  });

  it('edits relation values with a searchable picker', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <InlineEdit
        value="Apex GmbH"
        type="relation"
        options={[
          { value: 'Apex GmbH', label: 'Apex GmbH', description: 'Client' },
          { value: 'Donau Logistics AG', label: 'Donau Logistics AG', description: 'Client' },
        ]}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole('button', { name: /apex gmbh/i }));
    await user.click(screen.getByRole('button', { name: /apex gmbh/i }));
    await user.click(screen.getByRole('button', { name: /donau logistics ag/i }));

    expect(onSave).toHaveBeenCalledWith('Donau Logistics AG');
  });

  it('edits date values while preserving formatted display text at rest', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<InlineEdit value="2026-01-01" displayValue="01.01.2026" type="date" onSave={onSave} />);

    expect(screen.getByRole('button', { name: /01.01.2026/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /01.01.2026/i }));
    const input = screen.getByDisplayValue('2026-01-01');
    await user.clear(input);
    await user.type(input, '2026-02-15');
    await user.keyboard('{Enter}');

    expect(onSave).toHaveBeenCalledWith('2026-02-15');
  });

  it('edits datetime values with a native datetime-local input', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <InlineEdit
        value="2026-01-01T10:30"
        displayValue="01.01.2026 10:30"
        type="datetime"
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole('button', { name: /01.01.2026 10:30/i }));
    const input = screen.getByDisplayValue('2026-01-01T10:30');
    expect(input).toHaveAttribute('type', 'datetime-local');
    await user.clear(input);
    await user.type(input, '2026-01-01T11:45');
    await user.keyboard('{Enter}');

    expect(onSave).toHaveBeenCalledWith('2026-01-01T11:45');
  });

  it('sanitizes decimal values without forcing integer input', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<InlineEdit value="1200.50" type="decimal" onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: /1200.50/i }));
    const input = screen.getByDisplayValue('1200.50');
    await user.clear(input);
    await user.type(input, '€ 2,400.75x');
    await user.keyboard('{Enter}');

    expect(onSave).toHaveBeenCalledWith('2400.75');
  });
});
