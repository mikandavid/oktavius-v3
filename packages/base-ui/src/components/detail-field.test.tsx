import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { RecordKeyFacts } from './detail-field';

afterEach(() => {
  cleanup();
});

describe('RecordKeyFacts', () => {
  it('renders each fact as a label over a value', () => {
    render(<RecordKeyFacts fields={[{ label: 'Email', value: 'a@b.co' }]} />);
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('a@b.co')).toBeTruthy();
  });

  it('renders nothing for an empty list', () => {
    const { container } = render(<RecordKeyFacts fields={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('caps at 8 items', () => {
    const fields = Array.from({ length: 12 }, (_, i) => ({
      label: `L${i}`,
      value: `V${i}`,
    }));
    render(<RecordKeyFacts fields={fields} />);
    expect(screen.queryByText('L7')).not.toBeNull();
    expect(screen.queryByText('L8')).toBeNull();
  });

  it('renders a leading icon when provided', () => {
    render(
      <RecordKeyFacts
        fields={[{ label: 'Phone', value: '+431', icon: <svg data-testid="icn" /> }]}
      />,
    );
    expect(screen.getByTestId('icn')).toBeTruthy();
  });
});
