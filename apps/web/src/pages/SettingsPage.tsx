import { useState } from 'react';

import { Button, SettingsLayout, SettingsRow, SettingsSection, Switch } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { settingsPageIcon } from '@/lib/modulePageIcons';

export function SettingsPage() {
  const [activeKey, setActiveKey] = useState('general');

  return (
    <ModulePage
      title="Settings"
      subtitle="Organization and workspace preferences."
      icon={settingsPageIcon()}
    >
      <SettingsLayout
        items={[
          { key: 'general', label: 'General' },
          { key: 'members', label: 'Members' },
          { key: 'notifications', label: 'Notifications' },
          { key: 'integrations', label: 'Integrations' },
        ]}
        activeKey={activeKey}
        onSelect={setActiveKey}
      >
        {activeKey === 'general' ? (
          <SettingsSection title="General" description="Manage your organization name and locale.">
            <SettingsRow label="Organization name" description="Shown in reports and exports.">
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </SettingsRow>
            <SettingsRow
              label="Two-factor authentication"
              description="Require 2FA for all team members."
            >
              <Switch />
            </SettingsRow>
          </SettingsSection>
        ) : (
          <p className="text-sm text-muted-foreground">Select a settings section from the nav.</p>
        )}
      </SettingsLayout>
    </ModulePage>
  );
}
