# Section navigation layout

Use when a page has its own **left section nav** (settings categories, record sections like Profile / Compliance / Documents).

## Shell

| Layer                      | Behavior                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------- |
| App sidebar (left rail)    | Auto-compacts to icon-only while section nav is mounted — via `<AppSectionNavLayout>` |
| Section nav (page left)    | Fixed column on desktop; **scrolls independently** when items overflow                |
| Content panel (page right) | White `bg-card` tile; **scrolls independently** from section nav                      |
| Main workspace             | Uses `APP_MAIN_FIT_CLASS` (no outer scroll) while section nav is active               |

Never wrap section-nav pages in an extra scroll container — the layout owns scrolling.

## Required wiring

```tsx
import { ModulePage } from '@/components/common/PageLayout';
import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { AppSectionNavLayout } from '@/components/layout/AppSectionNavLayout';

<ModulePage
  title="Settings"
  icon={settingsPageIcon()}
  layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}
>
  <AppSectionNavLayout
    items={[
      { key: 'general', label: 'General', icon: <Settings2Icon size={16} weight="duotone" /> },
      {
        key: 'notifications',
        label: 'Notifications',
        icon: <NotificationsIcon size={16} weight="duotone" />,
      },
    ]}
    activeKey={activeSection}
    onSelect={setActiveSection}
  >
    <SettingsSection title="General">…</SettingsSection>
  </AppSectionNavLayout>
</ModulePage>;
```

**Always use `<AppSectionNavLayout>`** in `apps/web` — not raw `<SettingsLayout>`. The wrapper registers secondary nav and compacts the app sidebar.

## Visual rules

- **No border or outline** on the section nav container — plain list on the grey canvas
- **Active item:** `bg-sidebar-primary/10` + `text-sidebar-primary` (icon matches)
- **Inactive item:** `text-muted-foreground`, hover `bg-muted/50`
- **Do not** add left accent bars, card wrappers, or borders around the nav list
- Content stays in the existing white `rounded-card bg-card` panel from `SettingsLayout`

## Mobile

- Section nav becomes a **horizontal scroll tab row** above content (`md:hidden`)
- Content panel scrolls below tabs — single scroll region for content only

## When to use

| Use section nav                                               | Use instead                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| Settings / admin config with 3+ categories                    | `DetailView` when the record is short enough for one scroll |
| Record detail with many sections (profile, compliance, docs…) | Top tabs only when sections are peer work modes             |
| Component showcase / long categorized pages                   | `<DetailView>` for single-screen records                    |

## App sidebar preference

- List/index routes: user’s **Compact sidebar** preference persists (`localStorage`)
- Section-nav routes: app sidebar auto-compacts; user can expand via toggle or hover (session-only on that page)
- Settings **Compact sidebar** switch controls the list-page preference via `useAppShellLayout().setSidebarCollapsed`

## Imports

| Need                     | Import                                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| Layout + scroll behavior | `@oktavius/base-ui` → `SettingsLayout`, `SettingsSection`, `SettingsRow` |
| App shell integration    | `@/components/layout/AppSectionNavLayout`                                |
| Page height stack        | `@/components/common/pageChrome` → `MODULE_PAGE_SECTION_NAV_CLASS`       |
| Sidebar state (settings) | `@/components/layout/AppShellLayoutContext` → `useAppShellLayout`        |
