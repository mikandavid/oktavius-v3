export type GoogleMapsEmbedResult = {
  embedUrl: string | null;
  canEmbed: boolean;
};

type StructuredAddress = {
  line1?: string | null;
  line2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
};

export function buildGoogleMapsSearchUrl(query: string): string | null {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return null;

  const mapsUrl = new URL('https://www.google.com/maps/search/');
  mapsUrl.searchParams.set('api', '1');
  mapsUrl.searchParams.set('query', normalizedQuery);
  return mapsUrl.toString();
}

export function buildGoogleMapsSearchUrlFromAddress(address: StructuredAddress): string | null {
  const street = address.line1?.trim();
  const cityLine = [address.postalCode?.trim(), address.city?.trim()].filter(Boolean).join(' ');
  const country = address.country?.trim();
  const query = [street, cityLine, country].filter(Boolean).join(', ');

  return buildGoogleMapsSearchUrl(query);
}

/** Resolve a share/search/directions Google Maps URL to an iframe-safe embed URL. */
export function resolveGoogleMapsEmbed(mapsUrl: string): GoogleMapsEmbedResult {
  try {
    const url = new URL(mapsUrl);
    if (url.pathname.includes('/embed')) {
      return { embedUrl: mapsUrl, canEmbed: true };
    }

    const apiKey = (import.meta as ImportMeta & { env?: Record<string, string> }).env
      ?.VITE_GOOGLE_MAPS_EMBED_API_KEY;

    if (url.pathname.startsWith('/maps/dir/')) {
      const pathParts = url.pathname
        .split('/')
        .filter((part) => part && part !== 'maps' && part !== 'dir');
      if (pathParts.length >= 2) {
        const origin = decodeURIComponent(pathParts[0]);
        const destination = decodeURIComponent(pathParts[pathParts.length - 1]);
        const waypoints = pathParts.slice(1, -1).map((waypoint) => decodeURIComponent(waypoint));

        if (apiKey) {
          const embedUrl = new URL('https://www.google.com/maps/embed/v1/directions');
          embedUrl.searchParams.set('key', apiKey);
          embedUrl.searchParams.set('origin', origin);
          embedUrl.searchParams.set('destination', destination);
          if (waypoints.length > 0) {
            embedUrl.searchParams.set('waypoints', waypoints.join('|'));
          }
          return { embedUrl: embedUrl.toString(), canEmbed: true };
        }

        return {
          embedUrl: buildOutputEmbedUrl({ saddr: origin, daddr: destination }),
          canEmbed: true,
        };
      }
    }

    if (url.pathname.startsWith('/maps/search/')) {
      const query = url.searchParams.get('query');
      if (query) {
        return { embedUrl: buildOutputEmbedUrl({ q: query }), canEmbed: true };
      }
    }

    if (url.pathname.startsWith('/maps/place/')) {
      const placeSegment = url.pathname.split('/place/')[1]?.split('/')[0];
      const query = placeSegment
        ? decodeURIComponent(placeSegment.replace(/\+/g, ' '))
        : url.searchParams.get('q');
      if (query) {
        return { embedUrl: buildOutputEmbedUrl({ q: query }), canEmbed: true };
      }
    }

    const query = url.searchParams.get('q') ?? url.searchParams.get('query');
    if (query) {
      return { embedUrl: buildOutputEmbedUrl({ q: query }), canEmbed: true };
    }

    return { embedUrl: buildOutputEmbedUrl({ q: mapsUrl }), canEmbed: true };
  } catch {
    return { embedUrl: null, canEmbed: false };
  }
}

function buildOutputEmbedUrl(params: Record<string, string>) {
  const embedUrl = new URL('https://maps.google.com/maps');
  for (const [key, value] of Object.entries(params)) {
    embedUrl.searchParams.set(key, value);
  }
  embedUrl.searchParams.set('output', 'embed');
  embedUrl.searchParams.set('hl', 'en');
  return embedUrl.toString();
}

const GOOGLE_MAPS_URL_REGEX = /https?:\/\/(?:www\.)?google\.(?:com|[a-z]{2})\/maps\/[^\s)]+/gi;

export function extractGoogleMapsUrls(text: string): string[] {
  const matches = text.match(GOOGLE_MAPS_URL_REGEX);
  return matches ? [...new Set(matches)] : [];
}
