import type { ReactNode } from 'react';

import { MoneyText, SectionCard, cn, formatDisplayDate } from '@oktavius/base-ui';

import {
  type CustomFieldDefinition,
  type CustomFieldValues,
  useCustomFieldDefinitions,
} from '@/lib/custom-fields';

type CustomFieldsDetailSectionProps = {
  entityType: string;
  customFields?: CustomFieldValues | null;
  title?: string;
  className?: string;
};

function formatCustomValue(definition: CustomFieldDefinition, value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') return '—';

  switch (definition.fieldType) {
    case 'checkbox':
      return value ? 'Yes' : 'No';
    case 'select': {
      const option = definition.options?.find((entry) => entry.value === String(value));
      return option?.label ?? String(value);
    }
    case 'multiselect': {
      if (!Array.isArray(value)) return String(value);
      const labels = new Map(definition.options?.map((entry) => [entry.value, entry.label]) ?? []);
      return value.map((entry) => labels.get(String(entry)) ?? String(entry)).join(', ');
    }
    case 'currency':
      return <MoneyText value={String(value)} currency="EUR" />;
    case 'date':
      return formatDisplayDate(String(value));
    default:
      return String(value);
  }
}

export function CustomFieldsDetailSection({
  entityType,
  customFields,
  title = 'Custom fields',
  className,
}: CustomFieldsDetailSectionProps) {
  const { definitions } = useCustomFieldDefinitions(entityType);

  if (!definitions.length || !customFields) return null;

  const entries = definitions
    .map((definition) => ({
      definition,
      value: customFields[definition.fieldKey],
    }))
    .filter(({ value }) => value !== undefined && value !== null && value !== '');

  if (entries.length === 0) return null;

  const grouped = entries.reduce(
    (sections, entry) => {
      const key = entry.definition.section ?? 'General';
      if (!sections[key]) sections[key] = [];
      sections[key].push(entry);
      return sections;
    },
    {} as Record<string, typeof entries>,
  );

  return (
    <div className={cn('space-y-4', className)}>
      {Object.entries(grouped).map(([section, sectionEntries]) => (
        <SectionCard
          key={section}
          title={Object.keys(grouped).length > 1 ? section : title}
          meta={Object.keys(grouped).length > 1 ? title : undefined}
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            {sectionEntries.map(({ definition, value }) => (
              <div key={definition.fieldKey}>
                <dt className="text-xs font-medium text-muted-foreground">{definition.label}</dt>
                <dd className="text-sm text-foreground">{formatCustomValue(definition, value)}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      ))}
    </div>
  );
}
