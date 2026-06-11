import { useMemo, useState, type ComponentType, type ReactNode } from 'react';

import { SettingsSection, type SettingsNavItem } from '@oktavius/base-ui';

import { SectionErrorBoundary } from '@/core/errors/SectionErrorBoundary';
import { AppSectionNavLayout } from '@/components/layout/AppSectionNavLayout';
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
};

type SettingsPageFactoryProps = {
  sections: SettingsSectionConfig[];
  activeKey?: string;
  onActiveKeyChange?: (key: string) => void;
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
  }));
}

export function SettingsPageFactory({
  sections,
  activeKey,
  onActiveKeyChange,
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
    >
      {activeSection ? (
        <SectionErrorBoundary sectionId={`settings.${activeSection.id}`}>
          <SettingsSection
            title={activeSection.title ?? activeSection.label}
            description={activeSection.sectionDescription ?? activeSection.description}
          >
            {activeSection.render()}
          </SettingsSection>
        </SectionErrorBoundary>
      ) : null}
    </AppSectionNavLayout>
  );
}
