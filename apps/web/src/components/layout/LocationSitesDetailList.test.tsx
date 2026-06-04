import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { LocationDetailItem } from '@/lib/locations/types';

import { getLocationMapsSearchUrl, LocationSiteListRow } from './LocationSitesDetailList';

function makeLocation(overrides: Partial<LocationDetailItem> = {}): LocationDetailItem {
  return {
    id: 'loc_vienna',
    name: 'Vienna office',
    isActive: true,
    branchCode: null,
    designation: null,
    locality: null,
    category: null,
    phone: null,
    mobilePhone: null,
    fax: null,
    companyName: null,
    email: null,
    street: null,
    postalCode: null,
    ...overrides,
  };
}

describe('LocationSiteListRow', () => {
  it('shows the shared map preview action for addressable locations', () => {
    const html = renderToStaticMarkup(
      <LocationSiteListRow
        item={makeLocation({
          street: 'Mariahilfer Straße 88',
          postalCode: '1070',
          locality: 'Vienna',
        })}
      />,
    );

    expect(html).toContain('View map');
    expect(
      getLocationMapsSearchUrl(
        makeLocation({
          street: 'Mariahilfer Straße 88',
          postalCode: '1070',
          locality: 'Vienna',
        }),
      ),
    ).toBe(
      'https://www.google.com/maps/search/?api=1&query=Mariahilfer+Stra%C3%9Fe+88%2C+1070+Vienna',
    );
  });

  it('does not show a map action when no address is available', () => {
    const html = renderToStaticMarkup(
      <LocationSiteListRow
        item={makeLocation({
          id: 'loc_remote',
          name: 'Remote',
        })}
      />,
    );

    expect(html).not.toContain('View map');
  });
});
