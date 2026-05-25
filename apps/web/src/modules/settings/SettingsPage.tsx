import { useState } from 'react';

import { Combobox, SettingsRow, SettingsSection, Switch } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { AppSectionNavLayout } from '@/components/layout/AppSectionNavLayout';
import { useAppShellLayout } from '@/components/layout/AppShellLayoutContext';
import {
  CatalogOptionsManager,
  type CatalogOption,
} from '@/components/settings/CatalogOptionsManager';
import { DocumentIcon, NotificationsIcon, Settings2Icon } from '@/lib/icons';
import { settingsPageIcon } from '@/lib/modulePageIcons';
import { toast } from '@/lib/toast';

const SETTINGS_NAV = [
  { key: 'general', label: 'General', icon: <Settings2Icon size={16} weight="duotone" /> },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: <NotificationsIcon size={16} weight="duotone" />,
  },
  { key: 'catalogs', label: 'Catalogs', icon: <DocumentIcon size={16} weight="duotone" /> },
];

const INITIAL_PAYMENT_TERMS: CatalogOption[] = [
  { id: 'pt_net30', label: 'Net 30', code: 'NET30', active: true, sortOrder: 1 },
  { id: 'pt_net14', label: 'Net 14', code: 'NET14', active: true, sortOrder: 2 },
  { id: 'pt_due', label: 'Due on receipt', code: 'DUE', active: true, sortOrder: 3 },
  { id: 'pt_eom', label: 'End of month', code: 'EOM', active: false, sortOrder: 4 },
];

export function SettingsPage() {
  const { isSidebarCollapsed, setSidebarCollapsed } = useAppShellLayout();
  const [activeSection, setActiveSection] = useState('general');
  const [emailDigest, setEmailDigest] = useState(true);
  const [approvalAlerts, setApprovalAlerts] = useState(true);
  const [locale, setLocale] = useState('de-AT');
  const [paymentTerms, setPaymentTerms] = useState(INITIAL_PAYMENT_TERMS);

  const handleSavePaymentTerm = (option: CatalogOption) => {
    setPaymentTerms((current) => {
      const exists = current.some((entry) => entry.id === option.id);
      if (exists) {
        return current.map((entry) => (entry.id === option.id ? option : entry));
      }
      return [...current, option];
    });
    toast.success('Payment term saved.');
  };

  const handleDeletePaymentTerm = (id: string) => {
    setPaymentTerms((current) => current.filter((entry) => entry.id !== id));
    toast.success('Payment term removed.');
  };

  return (
    <ModulePage
      title="Settings"
      subtitle="Workspace preferences and catalog configuration"
      icon={settingsPageIcon()}
      layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}
    >
      <AppSectionNavLayout
        items={SETTINGS_NAV}
        activeKey={activeSection}
        onSelect={setActiveSection}
      >
        {activeSection === 'general' ? (
          <SettingsSection title="General" description="Defaults applied across the workspace.">
            <SettingsRow
              label="Compact sidebar"
              description="Keep the app navigation rail icon-only on list pages."
            >
              <Switch checked={isSidebarCollapsed} onCheckedChange={setSidebarCollapsed} />
            </SettingsRow>
            <SettingsRow label="Locale" description="Formatting for dates, numbers, and currency.">
              <Combobox
                value={locale}
                onChange={(value) => setLocale(value ?? 'de-AT')}
                options={[
                  { value: 'de-AT', label: 'German (Austria)' },
                  { value: 'de-DE', label: 'German (Germany)' },
                  { value: 'en-GB', label: 'English (UK)' },
                ]}
                className="w-[220px]"
              />
            </SettingsRow>
          </SettingsSection>
        ) : null}

        {activeSection === 'notifications' ? (
          <SettingsSection
            title="Notifications"
            description="Choose how Oktavius keeps you informed."
          >
            <SettingsRow
              label="Daily email digest"
              description="Summary of tasks, approvals, and overdue items."
            >
              <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
            </SettingsRow>
            <SettingsRow
              label="Approval alerts"
              description="Notify when a record needs your sign-off."
            >
              <Switch checked={approvalAlerts} onCheckedChange={setApprovalAlerts} />
            </SettingsRow>
          </SettingsSection>
        ) : null}

        {activeSection === 'catalogs' ? (
          <SettingsSection
            title="Catalogs"
            description="User-managed values for pickers and filters."
          >
            <CatalogOptionsManager
              title="Payment terms"
              description="Shown on invoices and client commercial terms."
              options={paymentTerms}
              orderable
              onSave={handleSavePaymentTerm}
              onDelete={handleDeletePaymentTerm}
              onReorder={setPaymentTerms}
            />
          </SettingsSection>
        ) : null}
      </AppSectionNavLayout>
    </ModulePage>
  );
}
