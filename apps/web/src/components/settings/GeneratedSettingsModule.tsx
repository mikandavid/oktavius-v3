import { type SettingsNavItem, SettingsSection } from '@oktavius/base-ui';
import { type ReactNode, useState } from 'react';

import { AppSectionNavLayout } from '@/components/layout/AppSectionNavLayout';

export type GeneratedSettingsSection = {
  key: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  title: string;
  sectionDescription?: string;
  render: () => ReactNode;
};

type GeneratedSettingsModuleProps = {
  sections: GeneratedSettingsSection[];
  activeKey?: string;
  onActiveKeyChange?: (key: string) => void;
};

export function buildSettingsNavItems(sections: GeneratedSettingsSection[]): SettingsNavItem[] {
  return sections.map((section) => ({
    key: section.key,
    label: section.label,
    icon: section.icon,
    description: section.description,
  }));
}

/** Generated settings template: section nav + active SettingsSection content. */
export function GeneratedSettingsModule({
  sections,
  activeKey,
  onActiveKeyChange,
}: GeneratedSettingsModuleProps) {
  const [internalActiveKey, setInternalActiveKey] = useState(sections[0]?.key ?? '');
  const resolvedActiveKey = activeKey ?? internalActiveKey;
  const activeSection =
    sections.find((section) => section.key === resolvedActiveKey) ?? sections[0];

  const handleSelect = (key: string) => {
    setInternalActiveKey(key);
    onActiveKeyChange?.(key);
  };

  return (
    <AppSectionNavLayout
      items={buildSettingsNavItems(sections)}
      activeKey={activeSection?.key ?? ''}
      onSelect={handleSelect}
    >
      {activeSection ? (
        <SettingsSection title={activeSection.title}>{activeSection.render()}</SettingsSection>
      ) : null}
    </AppSectionNavLayout>
  );
}
