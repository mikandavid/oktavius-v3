/** Shared UX limits — keep in sync with docs/ui-rules/ui-system.md and FilterToolbar. */

/** Detail workspace tabs (Overview + module tabs + Activity + Files). */
export const MAX_DETAIL_TABS = 6;

/** FilterToolbar.FILTER_TOOLBAR_SLOT_COUNT */
export const MAX_LIST_FILTERS = 3;

/** Max extraTabs when EntityDetailWorkspaceTabs uses default Activity + Files. */
export const MAX_ENTITY_DETAIL_EXTRA_TABS = MAX_DETAIL_TABS - 3;
