# Map preview components

Component registry: [`component-registry.md`](./component-registry.md) (Maps section).

Live examples: `/showcase` → **ERP patterns** → GoogleMapsPreview / GoogleMapsDialog.

---

## When to use which

| Need                                                   | Component                     | Notes                                   |
| ------------------------------------------------------ | ----------------------------- | --------------------------------------- |
| Inline map on detail page, route panel, location field | **`GoogleMapsPreview`**       | Preferred — no dialog required          |
| Compact trigger in chat, table row, or message         | **`GoogleMapsPreviewButton`** | Opens `GoogleMapsDialog`                |
| Full-screen map only                                   | **`GoogleMapsDialog`**        | Controlled `open` / `onOpenChange`      |
| Shared iframe logic                                    | **`GoogleMapsEmbedFrame`**    | Used internally — prefer Preview/Dialog |

**Default:** use **`GoogleMapsPreview`** wherever there is room (detail tabs, logistics, field service routes). Reserve the dialog for space-constrained contexts (agent chat, list rows).

---

## URL handling

All components accept normal Google Maps share URLs (`/maps/dir/…`, `/maps/search/…`, `/maps/place/…`).

`resolveGoogleMapsEmbed()` in `@/components/maps/googleMapsEmbed` converts links to iframe-safe embed URLs:

- **Without API key** — uses `maps.google.com/maps?…&output=embed` (directions via `saddr` / `daddr`).
- **With `VITE_GOOGLE_MAPS_EMBED_API_KEY`** — uses official Embed API for directions.

Never pass a raw `/maps/dir/…` URL directly to an iframe — Google blocks it.

Extract links from agent text:

```tsx
import { extractGoogleMapsUrls } from '@/components/maps/googleMapsEmbed';
```

---

## Inline preview

```tsx
import { GoogleMapsPreview } from '@/components/maps/GoogleMapsDialog';

<GoogleMapsPreview
  url="https://www.google.com/maps/dir/Vienna/Salzburg"
  title="Route"
  height={320}
/>;
```

Optional `showHeader={false}` for compact embeds inside `SectionCard`.

---

## Chat / compact

```tsx
import { GoogleMapsPreviewButton } from '@/components/maps/GoogleMapsDialog';

<GoogleMapsPreviewButton url={mapsUrl} label="View route" />;
```

---

## Visual rules

- Icons: `MapIcon`, `ExternalLinkIcon` from `@/lib/icons`.
- Container: `rounded-card border border-border/60 bg-card` (Preview header) — matches other embedded media blocks.
- Always provide **Open in Google Maps** external link alongside embed.
- Loading: built-in spinner; fallback empty state if embed fails or times out.

---

## Don't

- Embed Google Maps with raw share URLs in custom iframes.
- Use third-party map libraries for standard route/place preview — use these components.
- Put map preview inside nested `SectionCard` + inner bordered card — one surface only.
