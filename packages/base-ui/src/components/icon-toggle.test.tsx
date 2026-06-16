import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

import { IconToggle } from './icon-toggle';

describe('IconToggle', () => {
  it('reflects pressed state via aria-pressed', () => {
    render(
      <IconToggle pressed bordered tone="info" aria-label="Web search">
        <svg data-testid="icn" />
      </IconToggle>,
    );
    expect(screen.getByRole('button', { name: 'Web search' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('applies the info tone classes when pressed', () => {
    render(
      <IconToggle pressed bordered tone="info" aria-label="Web search">
        <svg />
      </IconToggle>,
    );
    expect(screen.getByRole('button', { name: 'Web search' }).className).toContain('text-info');
  });

  it('uses idle classes when not pressed', () => {
    render(
      <IconToggle bordered tone="info" aria-label="Web search">
        <svg />
      </IconToggle>,
    );
    const btn = screen.getByRole('button', { name: 'Web search' });
    expect(btn.className).toContain('text-muted-foreground');
    expect(btn.className).not.toContain('text-info');
  });

  it('applies the accent tone classes when pressed', () => {
    render(
      <IconToggle pressed bordered tone="accent" aria-label="Memory">
        <svg />
      </IconToggle>,
    );
    expect(screen.getByRole('button', { name: 'Memory' }).className).toContain('text-accent');
  });

  it('applies the neutral tone background when pressed', () => {
    render(
      <IconToggle pressed tone="neutral" aria-label="Voice">
        <svg />
      </IconToggle>,
    );
    expect(screen.getByRole('button', { name: 'Voice' }).className).toContain('bg-muted');
  });

  it('fires onClick and respects disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <IconToggle aria-label="Attach" onClick={onClick}>
        <svg />
      </IconToggle>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Attach' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <IconToggle aria-label="Attach" disabled onClick={onClick}>
        <svg />
      </IconToggle>,
    );
    await user.click(screen.getByRole('button', { name: 'Attach' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
