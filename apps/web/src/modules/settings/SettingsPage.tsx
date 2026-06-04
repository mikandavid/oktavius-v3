import { useEffect, useMemo, useState } from 'react';

import { Combobox, SettingsRow, Switch } from '@oktavius/base-ui';

import { createConfiguredCatalogOptionsStore } from '@/api/apiStoreConfig';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { ModulePage } from '@/components/common/PageLayout';
import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { useAppShellLayout } from '@/components/layout/AppShellLayoutContext';
import {
  CatalogOptionsManager,
  type CatalogOption,
} from '@/components/settings/CatalogOptionsManager';
import {
  GeneratedSettingsModule,
  type GeneratedSettingsSection,
} from '@/components/settings/GeneratedSettingsModule';
import { WorkspaceLocationsOverview } from '@/components/settings/WorkspaceLocationsOverview';
import { useActiveLocation } from '@/lib/locations/ActiveLocationContext';
import { DocumentIcon, NotificationsIcon, Settings2Icon } from '@/lib/icons';
import { getWindowStorage } from '@/lib/storage/safeStorage';
import { settingsPageIcon } from '@/lib/modulePageIcons';
import { appToast } from '@/lib/toast';

const INITIAL_PAYMENT_TERMS: CatalogOption[] = [
  { id: 'pt_net30', label: 'Net 30', code: 'NET30', active: true, sortOrder: 1 },
  { id: 'pt_net14', label: 'Net 14', code: 'NET14', active: true, sortOrder: 2 },
  { id: 'pt_due', label: 'Due on receipt', code: 'DUE', active: true, sortOrder: 3 },
  { id: 'pt_eom', label: 'End of month', code: 'EOM', active: false, sortOrder: 4 },
];

export function SettingsPage() {
  const { locations } = useActiveLocation();
  const { isSidebarCollapsed, setSidebarCollapsed } = useAppShellLayout();
  const [activeSection, setActiveSection] = useState('general');
  const [emailDigest, setEmailDigest] = useState(true);
  const [approvalAlerts, setApprovalAlerts] = useState(true);
  const [formatLocale, setFormatLocale] = useState('de-AT');
  const [paymentTerms, setPaymentTerms] = useState(INITIAL_PAYMENT_TERMS);
  const storage = getWindowStorage('localStorage');
  const paymentTermsStore = useMemo(
    () =>
      createConfiguredCatalogOptionsStore({
        catalogKey: 'paymentTerms',
        defaults: INITIAL_PAYMENT_TERMS,
        storage,
        env: import.meta.env,
      }),
    [storage],
  );

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve(paymentTermsStore.load()).then((loadedPaymentTerms) => {
      if (!cancelled) {
        setPaymentTerms(loadedPaymentTerms);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [paymentTermsStore]);

  const persistPaymentTerms = (nextPaymentTerms: CatalogOption[]) => {
    setPaymentTerms(nextPaymentTerms);
    void Promise.resolve(paymentTermsStore.save(nextPaymentTerms)).catch((error: unknown) => {
      appToast.fromApiError(error, 'Payment terms could not be saved.');
    });
  };

  const handleSavePaymentTerm = (option: CatalogOption) => {
    const nextPaymentTerms = (() => {
      const exists = paymentTerms.some((entry) => entry.id === option.id);
      if (exists) {
        return paymentTerms.map((entry) => (entry.id === option.id ? option : entry));
      }
      return [...paymentTerms, option];
    })();
    persistPaymentTerms(nextPaymentTerms);
    appToast.success('Payment term saved.');
  };

  const handleDeletePaymentTerm = (id: string) => {
    persistPaymentTerms(paymentTerms.filter((entry) => entry.id !== id));
    appToast.success('Payment term removed.');
  };

  const settingsSections: GeneratedSettingsSection[] = [
    {
      key: 'general',
      label: 'General',
      icon: <Settings2Icon size={16} weight="duotone" />,
      title: 'General',
      sectionDescription: 'Defaults applied across the workspace.',
      render: () => (
        <>
          <SettingsRow
            label="Compact sidebar"
            description="Keep the app navigation rail icon-only on list pages."
          >
            <Switch checked={isSidebarCollapsed} onCheckedChange={setSidebarCollapsed} />
          </SettingsRow>
          <SettingsRow label="Interface language" description="Labels and navigation copy.">
            <LanguageSelector />
          </SettingsRow>
          <SettingsRow
            label="Format locale"
            description="Formatting for dates, numbers, and currency."
          >
            <Combobox
              value={formatLocale}
              onChange={(value) => setFormatLocale(value ?? 'de-AT')}
              options={[
                { value: 'de-AT', label: 'German (Austria)' },
                { value: 'de-DE', label: 'German (Germany)' },
                { value: 'en-GB', label: 'English (UK)' },
              ]}
              className="w-[220px]"
            />
          </SettingsRow>
          <div className="border-b border-border/50 py-3 last:border-b-0">
            <div className="mb-3">
              <p className="text-sm font-medium text-foreground">Locations</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Sites available in the active-location picker. Open the location menu in the header
                for full contact details.
              </p>
            </div>
            <WorkspaceLocationsOverview locations={locations} />
          </div>
        </>
      ),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: <NotificationsIcon size={16} weight="duotone" />,
      title: 'Notifications',
      sectionDescription: 'Choose how Oktavius keeps you informed.',
      render: () => (
        <>
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
        </>
      ),
    },
    {
      key: 'catalogs',
      label: 'Catalogs',
      icon: <DocumentIcon size={16} weight="duotone" />,
      title: 'Catalogs',
      sectionDescription: 'User-managed values for pickers and filters.',
      render: () => (
        <CatalogOptionsManager
          title="Payment terms"
          description="Shown on invoices and client commercial terms."
          options={paymentTerms}
          orderable
          onSave={handleSavePaymentTerm}
          onDelete={handleDeletePaymentTerm}
          onReorder={persistPaymentTerms}
        />
      ),
    },
  ];

  return (
    <ModulePage
      title="Settings"
      subtitle="Workspace preferences and catalog configuration"
      icon={settingsPageIcon()}
      layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}
    >
      <GeneratedSettingsModule
        sections={settingsSections}
        activeKey={activeSection}
        onActiveKeyChange={setActiveSection}
      />
    </ModulePage>
  );
}
