import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, SettingsRow, SettingsSection } from '@oktavius/base-ui';

import { useDemoData } from '@/app/demo-data';
import { ModulePage } from '@/components/common/PageLayout';
import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { AppSectionNavLayout } from '@/components/layout/AppSectionNavLayout';
import { Settings2Icon, UserCircleIcon } from '@/lib/icons';
import { userRecordPageIcon } from '@/lib/modulePageIcons';

const PROFILE_NAV = [
  { key: 'account', label: 'Account', icon: <UserCircleIcon size={16} weight="duotone" /> },
  {
    key: 'workspace',
    label: 'Workspace',
    icon: <Settings2Icon size={16} weight="duotone" />,
  },
] as const;

export function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, activeOrganization } = useDemoData();
  const [activeSection, setActiveSection] =
    useState<(typeof PROFILE_NAV)[number]['key']>('account');

  return (
    <ModulePage
      title="Profile"
      subtitle={currentUser.email}
      icon={userRecordPageIcon()}
      layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}
    >
      <AppSectionNavLayout
        items={[...PROFILE_NAV]}
        activeKey={activeSection}
        onSelect={(key) => setActiveSection(key as (typeof PROFILE_NAV)[number]['key'])}
      >
        {activeSection === 'account' ? (
          <SettingsSection title="Account" description="Your personal details in this workspace.">
            <SettingsRow label="Full name">
              <span className="text-sm text-foreground">{currentUser.name}</span>
            </SettingsRow>
            <SettingsRow label="Email">
              <span className="text-sm text-foreground">{currentUser.email}</span>
            </SettingsRow>
            <SettingsRow label="Role">
              <span className="text-sm text-foreground">{currentUser.role}</span>
            </SettingsRow>
            <SettingsRow label="Team">
              <span className="text-sm text-foreground">{currentUser.team || '—'}</span>
            </SettingsRow>
            <SettingsRow label="Organisation">
              <span className="text-sm text-foreground">{activeOrganization.name}</span>
            </SettingsRow>
          </SettingsSection>
        ) : null}

        {activeSection === 'workspace' ? (
          <SettingsSection
            title="Workspace"
            description="Defaults and catalog configuration for the active organisation."
          >
            <SettingsRow
              label="Workspace settings"
              description="Language, notifications, locations, and catalog values."
            >
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                Open settings
              </Button>
            </SettingsRow>
          </SettingsSection>
        ) : null}
      </AppSectionNavLayout>
    </ModulePage>
  );
}
