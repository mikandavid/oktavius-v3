import type { ReactNode } from 'react';

import { SectionCard } from '@oktavius/base-ui';

type DetailFieldProps = {
  key?: string;
  label: string;
  value: ReactNode;
  section?: string;
  colSpan?: 1 | 2;
};

export function DetailView({
  title,
  fields,
  subtitle,
}: {
  title: string;
  fields: DetailFieldProps[];
  subtitle?: string;
}) {
  const groupedFields = fields.reduce(
    (sections, field) => {
      const key = field.section ?? 'General';
      if (!sections[key]) sections[key] = [];
      sections[key].push(field);
      return sections;
    },
    {} as Record<string, DetailFieldProps[]>,
  );

  return (
    <SectionCard title={title} meta={subtitle}>
      <div className="space-y-4">
        {Object.entries(groupedFields).map(([section, sectionFields], index) => (
          <section
            key={section}
            className={index === 0 ? 'space-y-3' : 'space-y-3 border-t border-border/70 pt-4'}
          >
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {section}
            </h3>
            <dl className="grid gap-4 md:grid-cols-2">
              {sectionFields.map((field, fieldIndex) => (
                <div
                  key={field.key ?? `${section}-${field.label}-${fieldIndex}`}
                  className={field.colSpan === 2 ? 'space-y-1 md:col-span-2' : 'space-y-1'}
                >
                  <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    {field.label}
                  </dt>
                  <dd className="text-sm text-foreground">{field.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </SectionCard>
  );
}
