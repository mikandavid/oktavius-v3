import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  AddressMapAction,
  buildPlaceMapsUrl,
  buildStructuredAddressMapsUrl,
} from './AddressMapAction';

describe('AddressMapAction', () => {
  it('renders a shared map preview button for structured client locations', () => {
    const url = buildStructuredAddressMapsUrl({ city: 'Vienna', country: 'AT' });
    const html = renderToStaticMarkup(
      <AddressMapAction url={url} label="View client location" title="Client location" />,
    );

    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Vienna%2C+AT');
    expect(html).toContain('View client location');
  });

  it('builds map URLs for free-text case locations with context', () => {
    expect(buildPlaceMapsUrl('Friedhof Pitten', 'AT')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Friedhof+Pitten%2C+AT',
    );
  });

  it('renders nothing when no map URL can be built', () => {
    expect(renderToStaticMarkup(<AddressMapAction url={null} />)).toBe('');
    expect(buildPlaceMapsUrl('   ')).toBeNull();
  });
});
