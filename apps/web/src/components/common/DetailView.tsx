import type { ReactNode } from 'react';

import {
  DetailFieldGrid,
  RecordIdentity,
  RecordInfoHero,
  RecordInfoMeta,
  RecordVisual,
  SectionCard,
  type DetailFieldProps,
  type RecordVisualProps,
} from '@oktavius/base-ui';

export type { DetailFieldProps };

export type DetailViewVisualLayout = 'identity' | 'header';

export function DetailView({
  title,
  fields,
  subtitle,
  visual,
  visualLayout = 'identity',
  identityTitle,
  identitySubtitle,
  identityMeta,
  identityTrailing,
}: {
  title: string;
  fields: DetailFieldProps[];
  subtitle?: ReactNode;
  /** Logo, avatar, or module icon — anchors the card visually */
  visual?: RecordVisualProps;
  /** `identity` = full hero band; `header` = compact icon beside section title (when page title already names the record) */
  visualLayout?: DetailViewVisualLayout;
  /** When `visual` is set, overrides `title` for the hero identity line */
  identityTitle?: ReactNode;
  identitySubtitle?: ReactNode;
  identityMeta?: ReactNode;
  identityTrailing?: ReactNode;
}) {
  const primaryFields = fields.filter((field) => field.importance === 'primary');
  const metaFields = fields.filter((field) => field.importance === 'meta');
  const defaultFields = fields.filter(
    (field) => field.importance !== 'primary' && field.importance !== 'meta',
  );

  const groupedDefaults = defaultFields.reduce(
    (sections, field) => {
      const key = field.section ?? 'General';
      if (!sections[key]) sections[key] = [];
      sections[key].push(field);
      return sections;
    },
    {} as Record<string, DetailFieldProps[]>,
  );

  const hasDefaultSections = Object.keys(groupedDefaults).length > 0;
  const useIdentityBand = Boolean(visual && visualLayout === 'identity');
  const useHeaderVisual = Boolean(visual && visualLayout === 'header');

  return (
    <SectionCard
      title={useIdentityBand ? undefined : title}
      meta={useIdentityBand ? undefined : subtitle}
      leading={
        useHeaderVisual ? <RecordVisual {...visual!} size={visual!.size ?? 'md'} /> : undefined
      }
    >
      <div className="space-y-4">
        {useIdentityBand ? (
          <RecordIdentity
            visual={visual!}
            title={identityTitle ?? title}
            subtitle={identitySubtitle ?? subtitle}
            meta={identityMeta}
            trailing={identityTrailing}
          />
        ) : null}

        {primaryFields.length > 0 ? (
          <RecordInfoHero
            fields={primaryFields}
            className={useIdentityBand ? 'border-t border-border/50 pt-4' : undefined}
          />
        ) : null}

        {hasDefaultSections ? (
          <div
            className={
              primaryFields.length > 0 || useIdentityBand
                ? 'space-y-4 border-t border-border/50 pt-4'
                : 'space-y-4'
            }
          >
            {Object.entries(groupedDefaults).map(([section, sectionFields], index) => (
              <section
                key={section}
                className={index === 0 ? 'space-y-3' : 'space-y-3 border-t border-border/70 pt-4'}
              >
                {section !== 'General' ? (
                  <h3 className="text-xs font-semibold text-muted-foreground">{section}</h3>
                ) : null}
                <DetailFieldGrid fields={sectionFields} />
              </section>
            ))}
          </div>
        ) : null}

        {metaFields.length > 0 ? <RecordInfoMeta fields={metaFields} /> : null}
      </div>
    </SectionCard>
  );
}
