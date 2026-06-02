# Master-detail (`SplitView`)

## Layout

On **fill-height module pages** (default for previews and master-detail):

```tsx
<SplitView
  className="min-h-0 flex-1 w-full"
  defaultSidebarWidth={400}
  minSidebarWidth={320}
  maxSidebarWidth={760}
  persistKey="clients-master-detail"
  sidebarScroll
  sidebar={…}
>
  {detail content}
</SplitView>
```

- Split container is **`w-full min-h-0 flex-1`** — grows with the page, no fixed `vh` height.
- Do not add `border` on the split outer card — use borderless white surface on `bg-muted/40`.
- Users drag the separator between panes to resize. Pass **`persistKey`** (stable, unique per surface) to remember layout in `localStorage`.
- Size props are **pixels** (`defaultSidebarWidth`, `minSidebarWidth`, `maxSidebarWidth`), not percentages or Tailwind width classes.
- Default queue sizing is intentionally wide: `400 / 320 / 760`. Do not use sub-320px sidebars for queues; they make record titles unreadable and persisted layouts will keep the bad state.

Fixed heights (`min-h-[min(32rem,70vh)]`) are only for **showcase blocks** and other non-fill parents. See [`fill-height-pages.md`](./fill-height-pages.md).

## Fill-height pages (independent scroll)

When `SplitView` must fill the viewport and each pane scrolls separately:

```tsx
<ModulePage fillHeight …>
  <Tabs className={MODULE_TABS_FILL_CLASS}>
    <TabsContent className={MODULE_TABS_CONTENT_FILL_CLASS}>
      <SplitView className="min-h-0 flex-1" sidebarScroll sidebar={…} />
    </TabsContent>
  </Tabs>
</ModulePage>
```

Do not wrap the split in an extra `overflow-y-auto` container — that breaks independent pane scroll.

## Sidebar queue

```tsx
import { SplitViewQueue, QUEUE_ITEM_SELECTED_CLASS } from '@/components/common/SplitViewQueue';

sidebar={
  <SplitViewQueue>
    {items.map((item) => (
      <ListRow
        key={item.id}
        variant="queue"
        onClick={() => setSelectedId(item.id)}
        aria-current={selectedId === item.id}
        className={selectedId === item.id ? QUEUE_ITEM_SELECTED_CLASS : undefined}
        …
      />
    ))}
  </SplitViewQueue>
}
```

- **Selection:** `QUEUE_ITEM_SELECTED_CLASS` — muted fill only (`bg-muted/70`). No ring, no left accent bar.

| Do                             | Don't                                                               |
| ------------------------------ | ------------------------------------------------------------------- |
| `SplitViewQueue` (`gap-2 p-3`) | `divide-y`, `space-y-1 p-1`, or nested `<button><ListRow border-b>` |
| `ListRow variant="queue"`      | `ListRow` default variant in sidebars (stacked bottom borders)      |

## Queue filters

Use shared `<Tabs>` above the split for Open/All-style filters — not standalone `Button` toggles.

## Detail panel header

- **Title** → **meta line** (id · service · time) → **badges** (`StatusBadge`, severity) in a row under meta.
- Do not place badges in `justify-between` top-right next to the title (same as `ModulePage` `actions` rule).
