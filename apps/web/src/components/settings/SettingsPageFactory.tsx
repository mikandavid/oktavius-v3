import { type SettingsNavItem } from '@oktavius/base-ui';
import { type ComponentType, type ReactNode, useMemo, useState } from 'react';

import { AppSectionNavLayout } from '@/components/layout/AppSectionNavLayout';
import { SectionErrorBoundary } from '@/core/errors/SectionErrorBoundary';
import {
  canUsePermissionRequirement,
  EMPTY_PERMISSION_SUBJECT,
  type PermissionRequirement,
} from '@/lib/permissions';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

type IconProps = {
  size?: number;
  className?: string;
};

export type SettingsSectionConfig = {
  id: string;
  label: string;
  labelKey?: string;
  icon?: ReactNode | ComponentType<IconProps>;
  description?: string;
  title?: string;
  sectionDescription?: string;
  render: () => ReactNode;
  permission?: PermissionRequirement;
  /** Optional nav group header (e.g. 'Account' vs 'Workspace'). */
  group?: string;
};

type SettingsPageFactoryProps = {
  sections: SettingsSectionConfig[];
  activeKey?: string;
  onActiveKeyChange?: (key: string) => void;
  /** Ordered group names; groups not listed are appended in first-seen order. */
  groupOrder?: string[];
};

function renderIcon(icon: SettingsSectionConfig['icon']): ReactNode {
  if (!icon) return undefined;
  if (typeof icon !== 'function') return icon;
  const Icon = icon;
  return <Icon size={16} />;
}

export function buildSettingsFactoryNavItems(sections: SettingsSectionConfig[]): SettingsNavItem[] {
  return sections.map((section) => ({
    key: section.id,
    label: section.label,
    icon: renderIcon(section.icon),
    description: section.description,
    group: section.group,
  }));
}

export function SettingsPageFactory({
  sections,
  activeKey,
  onActiveKeyChange,
  groupOrder,
}: SettingsPageFactoryProps) {
  const [internalActiveKey, setInternalActiveKey] = useState(sections[0]?.id ?? '');
  const osirisRuntime = useOptionalOsirisRuntime();
  const permissionSubject = useMemo(
    () => osirisRuntime?.permissionSubject ?? EMPTY_PERMISSION_SUBJECT,
    [osirisRuntime?.permissionSubject],
  );
  const permittedSections = useMemo(
    () =>
      sections.filter((section) =>
        canUsePermissionRequirement(permissionSubject, section.permission),
      ),
    [permissionSubject, sections],
  );
  const resolvedActiveKey = activeKey ?? internalActiveKey;
  const activeSection =
    permittedSections.find((section) => section.id === resolvedActiveKey) ?? permittedSections[0];

  const handleSelect = (key: string) => {
    setInternalActiveKey(key);
    onActiveKeyChange?.(key);
  };

  return (
    <AppSectionNavLayout
      items={buildSettingsFactoryNavItems(permittedSections)}
      activeKey={activeSection?.id ?? ''}
      onSelect={handleSelect}
      groupOrder={groupOrder}
    >
      {activeSection ? (
        <SectionErrorBoundary sectionId={`settings.${activeSection.id}`}>
          <div className="space-y-5">
            <div className="border-b border-border pb-4">
              <h2 className="text-base font-semibold text-foreground">
                {activeSection.title ?? activeSection.label}
              </h2>
              {(activeSection.sectionDescription ?? activeSection.description) ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeSection.sectionDescription ?? activeSection.description}
                </p>
              ) : null}
            </div>
            {activeSection.render()}
          </div>
        </SectionErrorBoundary>
      ) : null}
    </AppSectionNavLayout>
  );
}
