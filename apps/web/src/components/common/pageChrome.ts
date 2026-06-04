/** Horizontal padding for scrollable module content inside the center workspace column. */
export const APP_MAIN_GUTTER_CLASS = 'p-3 md:p-6';

/**
 * Shared shell chrome — nav rail, top header, agent chat rail.
 * White/card surfaces on the grey page canvas (`bg-muted/40`).
 */
export const APP_SHELL_SURFACE_CLASS = 'bg-card';
export const APP_SHELL_BORDER_CLASS = 'border-border/60';

/**
 * Page header `actions` row — top-right on md+.
 * Order: Export (icon) → secondary → CTA last. All h-7 via PageHeaderButtons.
 */
export const PAGE_HEADER_ACTIONS_ROW = 'flex shrink-0 flex-wrap items-center justify-end gap-2';

/** Center column: header + scrollable module pages (between nav and chat). */
export const APP_WORKSPACE_COLUMN_CLASS =
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r border-border/50';

/** Main scroll region — grey canvas; modules render white cards on top. */
export const APP_MAIN_SCROLL_CLASS =
  'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-muted/40 [scrollbar-gutter:stable]';

/** Full-height module routes (e.g. /ai-chat) — no outer scroll; inner panel scrolls. */
export const APP_MAIN_FIT_CLASS = 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden';

/**
 * ModulePage that fills the workspace column — split views, previews, section nav.
 * Switches `<main>` to fit mode (no outer scroll) via `ModulePage fillHeight`.
 */
export const MODULE_PAGE_FILL_CLASS = 'flex min-h-0 flex-1 flex-col gap-4';

/** @deprecated alias — same as `MODULE_PAGE_FILL_CLASS` */
export const MODULE_PAGE_SECTION_NAV_CLASS = MODULE_PAGE_FILL_CLASS;

/** Tabs root on a fill-height module page. */
export const MODULE_TABS_FILL_CLASS = 'flex min-h-0 min-w-0 w-full flex-1 flex-col';

/** Tab panel that grows (preview / split-view tab). */
export const MODULE_TABS_CONTENT_FILL_CLASS =
  'flex min-h-0 min-w-0 w-full flex-1 flex-col outline-none';

/** Tab panel that scrolls when content overflows. */
export const MODULE_TABS_CONTENT_SCROLL_CLASS =
  'min-h-0 flex-1 overflow-y-auto overscroll-y-contain outline-none';

/**
 * Field group / section divider label inside cards and forms.
 * @see docs/ui-rules/foundation.md
 */
export const FIELD_GROUP_LABEL_CLASS =
  'text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground';
