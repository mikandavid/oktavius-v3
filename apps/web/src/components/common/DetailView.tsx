import {
  DetailFieldGrid,
  type DetailFieldProps as BaseDetailFieldProps,
  InlineEdit,
  type InlineEditProps,
  RecordIdentity,
  RecordInfoHero,
  RecordInfoMeta,
  RecordVisual,
  type RecordVisualProps,
  SectionCard,
} from '@oktavius/base-ui';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import type { PermissionRequirement } from '@/lib/permissions';
import { canUsePermissionRequirement, EMPTY_PERMISSION_SUBJECT } from '@/lib/permissions';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

export type DetailFieldProps = BaseDetailFieldProps & {
  /** Hide the field unless the active subject satisfies this requirement. */
  permission?: PermissionRequirement;
  /** Render this field value through the shared compact click-to-edit control. */
  inlineEdit?: Omit<InlineEditProps, 'className'>;
};

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
  const osirisRuntime = useOptionalOsirisRuntime();
  const permissionSubject = useMemo(
    () => osirisRuntime?.permissionSubject ?? EMPTY_PERMISSION_SUBJECT,
    [osirisRuntime?.permissionSubject],
  );
  const permittedFields = useMemo(
    () =>
      fields.filter((field) => canUsePermissionRequirement(permissionSubject, field.permission)),
    [fields, permissionSubject],
  );
  const displayFields = useMemo(
    () =>
      permittedFields.map((field) =>
        field.inlineEdit
          ? {
              ...field,
              value: <InlineEdit {...field.inlineEdit} />,
            }
          : field,
      ),
    [permittedFields],
  );
  const primaryFields = displayFields.filter((field) => field.importance === 'primary');
  const metaFields = displayFields.filter((field) => field.importance === 'meta');
  const defaultFields = displayFields.filter(
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
