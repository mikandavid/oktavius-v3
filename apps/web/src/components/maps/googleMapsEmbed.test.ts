import { describe, expect, it } from 'vitest';

import { buildGoogleMapsSearchUrlFromAddress } from './googleMapsEmbed';

describe('buildGoogleMapsSearchUrlFromAddress', () => {
  it('builds a Google Maps search URL from a structured address', () => {
    expect(
      buildGoogleMapsSearchUrlFromAddress({
        line1: ' Mariahilfer Straße 88 ',
        line2: '',
        postalCode: ' 1070 ',
        city: ' Vienna ',
        country: ' AT ',
      }),
    ).toBe(
      'https://www.google.com/maps/search/?api=1&query=Mariahilfer+Stra%C3%9Fe+88%2C+1070+Vienna%2C+AT',
    );
  });

  it('returns null when the address has no searchable parts', () => {
    expect(
      buildGoogleMapsSearchUrlFromAddress({
        line1: ' ',
        line2: '',
        postalCode: '',
        city: '',
        country: '',
      }),
    ).toBeNull();
  });
});
