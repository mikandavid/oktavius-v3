import {
  DetailFieldGrid,
  type DetailFieldProps as BaseDetailFieldProps,
  InlineEdit,
  type InlineEditProps,
  RecordIdentity,
  RecordInfoMeta,
  RecordKeyFacts,
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
  /** Override which column this field lands in. Defaults: primary/meta → aside, default → main. */
  placement?: 'main' | 'aside';
};

/** Retained for backward compatibility; the visual now always anchors the rail. */
export type DetailViewVisualLayout = 'identity' | 'header';

function placementOf(field: DetailFieldProps): 'main' | 'aside' {
  if (field.placement) return field.placement;
  if (field.importance === 'primary' || field.importance === 'meta') return 'aside';
  return 'main';
}

export function DetailView({
  title,
  fields,
  subtitle,
  visual,
  identityTitle,
  identitySubtitle,
  identityMeta,
  identityTrailing,
}: {
  title: string;
  fields: DetailFieldProps[];
  subtitle?: ReactNode;
  /** Logo, avatar, or module icon — anchors the rail identity */
  visual?: RecordVisualProps;
  /** Retained for compatibility; no longer changes layout. */
  visualLayout?: DetailViewVisualLayout;
  /** When `visual` is set, overrides `title` for the rail identity line */
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

  const asideFields = displayFields.filter((field) => placementOf(field) === 'aside');
  const mainFields = displayFields.filter((field) => placementOf(field) === 'main');
  const keyFacts = asideFields.filter((field) => field.importance !== 'meta');
  const railMeta = asideFields.filter((field) => field.importance === 'meta');

  const groupedMain = mainFields.reduce(
    (sections, field) => {
      const key = field.section ?? 'General';
      if (!sections[key]) sections[key] = [];
      sections[key].push(field);
      return sections;
    },
    {} as Record<string, DetailFieldProps[]>,
  );

  const hasIdentity = Boolean(visual);
  const hasRail = hasIdentity || keyFacts.length > 0 || railMeta.length > 0;
  const hasMain = Object.keys(groupedMain).length > 0;

  const mainContent = (
    <div className="space-y-4">
      {Object.entries(groupedMain).map(([section, sectionFields], index) => (
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
  );

  const railContent = (
    <div className="space-y-4">
      {hasIdentity ? (
        <RecordIdentity
          visual={visual!}
          title={identityTitle ?? title}
          subtitle={identitySubtitle ?? subtitle}
          meta={identityMeta}
          trailing={identityTrailing}
        />
      ) : null}
      {keyFacts.length > 0 ? (
        <RecordKeyFacts
          fields={keyFacts}
          className={hasIdentity ? 'border-t border-border/50 pt-4' : undefined}
        />
      ) : null}
      {railMeta.length > 0 ? <RecordInfoMeta fields={railMeta} /> : null}
    </div>
  );

  // No rail content → single full-width card (unchanged from the prior layout).
  if (!hasRail) {
    return (
      <SectionCard title={title} meta={subtitle}>
        {mainContent}
      </SectionCard>
    );
  }

  // Rail content but no main sections → rail alone, full width.
  if (!hasMain) {
    return <SectionCard>{railContent}</SectionCard>;
  }

  // Two-column profile. Rail is first in DOM (mobile-top) and placed right on lg.
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div data-testid="detail-rail" className="lg:order-2">
        <SectionCard>{railContent}</SectionCard>
      </div>
      <div data-testid="detail-main" className="lg:order-1">
        <SectionCard>{mainContent}</SectionCard>
      </div>
    </div>
  );
}
