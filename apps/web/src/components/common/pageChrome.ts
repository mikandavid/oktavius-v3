/** Horizontal padding for scrollable module content inside the center workspace column. */
export const APP_MAIN_GUTTER_CLASS = 'p-3 md:p-6';

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

/** ModulePage wrapper when the route uses a left section nav (`AppSectionNavLayout`). */
export const MODULE_PAGE_SECTION_NAV_CLASS = 'flex min-h-0 flex-1 flex-col gap-4';
