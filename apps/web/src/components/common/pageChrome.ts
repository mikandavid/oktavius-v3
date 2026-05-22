/** Horizontal padding for scrollable module content inside the center workspace column. */
export const APP_MAIN_GUTTER_CLASS = 'p-3 md:p-6';

export const PAGE_HEADER_ACTIONS_ROW_WIDE =
  'flex w-full min-w-0 flex-wrap items-center gap-2 xl:w-auto xl:justify-end';

/** Center column: header + scrollable module pages (between nav and chat). */
export const APP_WORKSPACE_COLUMN_CLASS =
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r border-border/50';

/** Main scroll region — grey canvas; modules render white cards on top. */
export const APP_MAIN_SCROLL_CLASS =
  'min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain bg-muted/40 [scrollbar-gutter:stable]';

/** Full-height module routes (e.g. /ai-chat) — no outer scroll; inner panel scrolls. */
export const APP_MAIN_FIT_CLASS = 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden';
