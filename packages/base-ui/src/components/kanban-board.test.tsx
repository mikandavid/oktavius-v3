import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { KanbanBoard } from './kanban-board';

const columns = [
  {
    id: 'todo',
    title: 'Todo',
    items: [{ id: 'task-1', title: 'Prepare file' }],
  },
];

describe('KanbanBoard', () => {
  it('uses native buttons for clickable cards and preserves keyboard activation', async () => {
    const user = userEvent.setup();
    const onCardClick = vi.fn();

    render(
      <KanbanBoard
        columns={columns}
        getItemId={(item) => item.id}
        renderCard={(item) => <span>{item.title}</span>}
        onCardClick={onCardClick}
      />,
    );

    const cardButton = screen.getByRole('button', { name: 'Prepare file' });

    expect(cardButton.tagName).toBe('BUTTON');

    cardButton.focus();
    await user.keyboard('{Enter}');

    const firstColumn = columns[0];
    if (!firstColumn) throw new Error('test fixture must contain a column');
    expect(onCardClick).toHaveBeenCalledWith(firstColumn.items[0], firstColumn);
  });
});
