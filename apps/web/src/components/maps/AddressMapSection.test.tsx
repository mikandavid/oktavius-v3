import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { AddressMapSection } from './AddressMapSection';

describe('AddressMapSection', () => {
  it('renders address context with an inline map preview', () => {
    const markup = renderToStaticMarkup(
      <AddressMapSection
        title="Client location"
        addressLines={['Lobengasse 593', '2823 Pitten', 'Austria']}
        url="https://www.google.com/maps/search/?api=1&query=Lobengasse%20593%202823%20Pitten%20Austria"
      />,
    );

    expect(markup).toContain('Client location');
    expect(markup).toContain('Lobengasse 593');
    expect(markup).toContain('2823 Pitten');
    expect(markup).toContain('Austria');
    expect(markup).toContain('<iframe');
  });

  it('renders nothing when no map URL is available', () => {
    expect(
      renderToStaticMarkup(
        <AddressMapSection title="Missing location" addressLines={['']} url={null} />,
      ),
    ).toBe('');
  });
});
