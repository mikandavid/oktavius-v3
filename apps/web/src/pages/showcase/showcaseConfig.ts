export type ShowcaseGroupId = 'foundations' | 'components' | 'data' | 'patterns';

export type ShowcaseSectionDef = {
  id: string;
  label: string;
  blurb: string;
};

export type ShowcaseGroupDef = {
  id: ShowcaseGroupId;
  label: string;
  description: string;
  sections: ShowcaseSectionDef[];
};

export const SHOWCASE_GROUPS: ShowcaseGroupDef[] = [
  {
    id: 'foundations',
    label: 'Foundations',
    description: 'Tokens, actions, and form inputs — the atoms everything else is built from.',
    sections: [
      { id: 'tokens', label: 'Design tokens', blurb: 'CSS variables, radius, shadows, colors' },
      { id: 'actions', label: 'Actions', blurb: 'Buttons, menus, confirm dialogs' },
      { id: 'inputs', label: 'Inputs', blurb: 'Text, pickers, combobox, files' },
    ],
  },
  {
    id: 'components',
    label: 'Components',
    description: 'Display, feedback, layout, and navigation building blocks.',
    sections: [
      { id: 'display', label: 'Display', blurb: 'Badges, avatars, money, charts' },
      { id: 'feedback', label: 'Feedback', blurb: 'Alerts, empty states, skeletons' },
      { id: 'layout', label: 'Layout', blurb: 'Cards, lists, split view, settings' },
      { id: 'nav', label: 'Navigation', blurb: 'Tabs, stepper, breadcrumb, command' },
    ],
  },
  {
    id: 'data',
    label: 'Data & shell',
    description: 'Tables, forms, calendars, and app chrome.',
    sections: [
      { id: 'data', label: 'Data & forms', blurb: 'CrudTable, EntityForm, attachments' },
      { id: 'calendar', label: 'Calendar', blurb: 'Planner views and scheduling' },
      { id: 'erp-shell', label: 'ERP shell', blurb: 'Header, notifications, documents' },
    ],
  },
  {
    id: 'patterns',
    label: 'ERP patterns',
    description: 'Composable module patterns and workflow blocks.',
    sections: [
      {
        id: 'patterns',
        label: 'Module patterns',
        blurb: 'Overview tabs, sub-entities, ERP blocks',
      },
    ],
  },
];

export const SECTION_TO_GROUP: Record<string, ShowcaseGroupId> = Object.fromEntries(
  SHOWCASE_GROUPS.flatMap((group) => group.sections.map((section) => [section.id, group.id])),
) as Record<string, ShowcaseGroupId>;

export const ALL_SECTIONS = SHOWCASE_GROUPS.flatMap((group) =>
  group.sections.map((section) => ({ ...section, groupId: group.id, groupLabel: group.label })),
);
