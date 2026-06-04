import type { CustomFieldDefinition, CustomFieldValues } from './types';

export const CUSTOM_FIELD_DEFINITIONS: Record<string, CustomFieldDefinition[]> = {
  client: [
    {
      id: 'cf_client_vip',
      entityType: 'client',
      fieldKey: 'vipTier',
      label: 'VIP tier',
      fieldType: 'select',
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'gold', label: 'Gold' },
        { value: 'platinum', label: 'Platinum' },
      ],
      section: 'Account',
      sortOrder: 10,
    },
    {
      id: 'cf_client_referral',
      entityType: 'client',
      fieldKey: 'referralSource',
      label: 'Referral source',
      fieldType: 'text',
      placeholder: 'Partner, event, inbound…',
      section: 'Account',
      sortOrder: 20,
    },
    {
      id: 'cf_client_newsletter',
      entityType: 'client',
      fieldKey: 'newsletterOptIn',
      label: 'Marketing newsletter',
      fieldType: 'checkbox',
      description: 'Send product updates and event invitations.',
      section: 'Preferences',
      sortOrder: 30,
    },
    {
      id: 'cf_client_notes',
      entityType: 'client',
      fieldKey: 'internalNotes',
      label: 'Internal notes',
      fieldType: 'textarea',
      section: 'Preferences',
      sortOrder: 40,
    } as CustomFieldDefinition & { colSpan?: number },
  ],
  contact: [
    {
      id: 'cf_contact_role',
      entityType: 'contact',
      fieldKey: 'decisionRole',
      label: 'Decision role',
      fieldType: 'select',
      options: [
        { value: 'champion', label: 'Champion' },
        { value: 'influencer', label: 'Influencer' },
        { value: 'blocker', label: 'Blocker' },
      ],
      sortOrder: 10,
    },
  ],
};

export function getCustomFieldDefinitions(entityType: string): CustomFieldDefinition[] {
  return (CUSTOM_FIELD_DEFINITIONS[entityType] ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function buildCustomFieldDefaults(definitions: CustomFieldDefinition[]): CustomFieldValues {
  const values: CustomFieldValues = {};
  for (const def of definitions) {
    if (def.defaultValue !== undefined) {
      values[def.fieldKey] = def.defaultValue;
      continue;
    }
    if (def.fieldType === 'checkbox') {
      values[def.fieldKey] = false;
    } else if (def.fieldType === 'multiselect') {
      values[def.fieldKey] = [];
    } else {
      values[def.fieldKey] = '';
    }
  }
  return values;
}
