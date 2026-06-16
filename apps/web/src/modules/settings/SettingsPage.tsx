import { Button, Combobox, SettingsRow, SettingsSection, Switch } from '@oktavius/base-ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { createConfiguredCatalogOptionsStore } from '@/api/apiStoreConfig';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { ModulePage } from '@/components/common/PageLayout';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import type { FormField, FormFieldValue } from '@/components/forms/EntityForm';
import { useAppShellLayout } from '@/components/layout/AppShellLayoutContext';
import { AccountSettingsSection } from '@/components/settings/AccountSettingsSection';
import { AiSettingsSection } from '@/components/settings/AiSettingsSection';
import {
  type CatalogOption,
  CatalogOptionsManager,
} from '@/components/settings/CatalogOptionsManager';
import { LocationPolicySettingsSection } from '@/components/settings/LocationPolicySettingsSection';
import { MembersPeopleSection } from '@/components/settings/members/MembersPeopleSection';
import { MembersRolesSection } from '@/components/settings/members/MembersRolesSection';
import { NotificationSettingsSection } from '@/components/settings/NotificationSettingsSection';
import { OrganizationSettingsSection } from '@/components/settings/OrganizationSettingsSection';
import { CONTROL_WIDTH, SettingsAutosaveFooter } from '@/components/settings/settingsForm';
import {
  SettingsPageFactory,
  type SettingsSectionConfig,
} from '@/components/settings/SettingsPageFactory';
import { WorkspaceLocationsOverview } from '@/components/settings/WorkspaceLocationsOverview';
import { useTranslation } from '@/core/i18n';
import { useDebouncedAutosave } from '@/lib/hooks/useDebouncedAutosave';
import {
  BrainIcon,
  DocumentIcon,
  EmailIcon,
  GlobeIcon,
  LocationIcon,
  LockIcon,
  NotificationsIcon,
  OrganizationIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  TeamIcon,
  UserCircleIcon,
  WhatsAppIcon,
} from '@/lib/icons';
import { useActiveLocation } from '@/lib/locations/ActiveLocationContext';
import type { LocationDetailItem } from '@/lib/locations/types';
import { settingsPageIcon } from '@/lib/modulePageIcons';
import { getWindowStorage } from '@/lib/storage/safeStorage';
import { appToast } from '@/lib/toast';
import { useOrgLocationMutations, useOrgLocations } from '@/modules/settings/locationsData';
import { MailSettingsSection } from '@/modules/settings/mail/MailSettingsSection';
import {
  resolveInitialSettingsSection,
  SETTINGS_SECTION_PARAM,
} from '@/modules/settings/settingsSectionParam';
import { WhatsAppSettingsSection } from '@/modules/settings/whatsapp/WhatsAppSettingsSection';
import type {
  OsirisOrgLocation,
  OsirisOrgLocationInput,
} from '@/runtime/osiris/locationAdminClient';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';
import {
  createDefaultOsirisWorkspaceSettings,
  type OsirisDateFormat,
  type OsirisTimeFormat,
  type OsirisWorkspaceSettings,
} from '@/runtime/osiris/workspaceSettingsClient';

const INITIAL_PAYMENT_TERMS: CatalogOption[] = [
  { id: 'pt_net30', label: 'Net 30', code: 'NET30', active: true, sortOrder: 1 },
  { id: 'pt_net14', label: 'Net 14', code: 'NET14', active: true, sortOrder: 2 },
  { id: 'pt_due', label: 'Due on receipt', code: 'DUE', active: true, sortOrder: 3 },
  { id: 'pt_eom', label: 'End of month', code: 'EOM', active: false, sortOrder: 4 },
];

const ADD_LOCATION_LABEL = 'Add location';

const DATE_FORMAT_OPTIONS: { value: OsirisDateFormat; label: string }[] = [
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
];

const TIME_FORMAT_OPTIONS: { value: OsirisTimeFormat; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '12h', label: '12h' },
];

const TIMEZONE_OPTIONS = [
  { value: 'Europe/Vienna', label: 'Europe/Vienna' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin' },
  { value: 'Europe/Zurich', label: 'Europe/Zurich' },
  { value: 'UTC', label: 'UTC' },
];

const locationFormFields: FormField[] = [
  { name: 'name', label: 'Site name', type: 'text', required: true },
  { name: 'branchCode', label: 'Branch code', type: 'text' },
  { name: 'companyName', label: 'Company name', type: 'text' },
  { name: 'category', label: 'Type', type: 'text' },
  { name: 'street', label: 'Street', type: 'text' },
  { name: 'postalCode', label: 'Postal code', type: 'text' },
  { name: 'locality', label: 'City', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone', type: 'phone' },
];

function locationToDetailItem(location: OsirisOrgLocation): LocationDetailItem {
  return {
    id: location.id,
    name: location.name,
    isActive: location.isActive,
    branchCode: location.branchCode,
    designation: location.designation,
    locality: location.locality,
    category: location.category,
    phone: location.phone,
    mobilePhone: location.mobilePhone,
    fax: location.fax,
    companyName: location.companyName,
    email: location.email,
    street: location.street,
    postalCode: location.postalCode,
  };
}

function locationToFormValues(location: LocationDetailItem | null): Record<string, FormFieldValue> {
  return {
    name: location?.name ?? '',
    branchCode: location?.branchCode ?? '',
    companyName: location?.companyName ?? '',
    category: location?.category ?? '',
    street: location?.street ?? '',
    postalCode: location?.postalCode ?? '',
    locality: location?.locality ?? '',
    email: location?.email ?? '',
    phone: location?.phone ?? '',
  };
}

function stringOrNull(value: FormFieldValue): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || null;
}

function formValuesToLocationInput(values: Record<string, FormFieldValue>): OsirisOrgLocationInput {
  return {
    name: String(values.name ?? '').trim(),
    branchCode: stringOrNull(values.branchCode),
    companyName: stringOrNull(values.companyName),
    category: stringOrNull(values.category),
    street: stringOrNull(values.street),
    postalCode: stringOrNull(values.postalCode),
    locality: stringOrNull(values.locality),
    email: stringOrNull(values.email),
    phone: stringOrNull(values.phone),
  };
}

export function SettingsPage() {
  const { t } = useTranslation();
  const { locations } = useActiveLocation();
  const osirisRuntime = useOptionalOsirisRuntime();
  const activeOrgId = osirisRuntime?.activeOrgId ?? null;
  const { isSidebarCollapsed, setSidebarCollapsed } = useAppShellLayout();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(() =>
    resolveInitialSettingsSection(searchParams.get(SETTINGS_SECTION_PARAM)),
  );
  const [workspaceSettings, setWorkspaceSettings] = useState<OsirisWorkspaceSettings>(() =>
    createDefaultOsirisWorkspaceSettings(),
  );
  const [isSavingWorkspaceSettings, setIsSavingWorkspaceSettings] = useState(false);
  const [workspaceSettingsSavedAt, setWorkspaceSettingsSavedAt] = useState<number | null>(null);
  // Gates autosave: stays false through the async load so the loaded value is
  // never written straight back; the first user edit flips it true for good.
  const hasEditedWorkspaceSettingsRef = useRef(false);
  const [hasEditedWorkspaceSettings, setHasEditedWorkspaceSettings] = useState(false);
  const locationsQuery = useOrgLocations();
  const locationMutations = useOrgLocationMutations();
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationDetailItem | null>(null);
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

  useEffect(() => {
    if (!activeOrgId || !osirisRuntime?.loadWorkspaceSettings) return;
    let cancelled = false;
    // Loading (or switching orgs) disarms autosave until the next user edit.
    hasEditedWorkspaceSettingsRef.current = false;
    setHasEditedWorkspaceSettings(false);
    setWorkspaceSettingsSavedAt(null);

    void osirisRuntime
      .loadWorkspaceSettings(activeOrgId)
      .then((loadedSettings) => {
        if (!cancelled) setWorkspaceSettings(loadedSettings);
      })
      .catch((error: unknown) => {
        appToast.fromApiError(error, 'Workspace settings could not be loaded.');
      });

    return () => {
      cancelled = true;
    };
  }, [activeOrgId, osirisRuntime]);

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

  // Single entry point for user edits to workspace settings: marks the form
  // dirty so the debounced autosave arms, then applies the change.
  const handleWorkspaceSettingsChange = useCallback((next: OsirisWorkspaceSettings) => {
    if (!hasEditedWorkspaceSettingsRef.current) {
      hasEditedWorkspaceSettingsRef.current = true;
      setHasEditedWorkspaceSettings(true);
    }
    setWorkspaceSettings(next);
  }, []);

  const updateWorkspaceDateTime = (
    key: keyof OsirisWorkspaceSettings['dateTime'],
    value: string,
  ) => {
    handleWorkspaceSettingsChange({
      ...workspaceSettings,
      dateTime: {
        ...workspaceSettings.dateTime,
        [key]: value,
      },
    });
  };

  const saveWorkspaceSettings = useCallback(
    async (settingsToSave: OsirisWorkspaceSettings) => {
      if (!activeOrgId || !osirisRuntime?.updateWorkspaceSettings) return;
      setIsSavingWorkspaceSettings(true);
      try {
        // Intentionally do not write the normalized response back into state:
        // the local value already matches what we sent, and a write-back during
        // active editing would both re-trigger the autosave and move the caret.
        await osirisRuntime.updateWorkspaceSettings(settingsToSave, activeOrgId);
        setWorkspaceSettingsSavedAt(Date.now());
      } catch (error) {
        appToast.fromApiError(error, 'Workspace settings could not be saved.');
      } finally {
        setIsSavingWorkspaceSettings(false);
      }
    },
    [activeOrgId, osirisRuntime],
  );

  useDebouncedAutosave(workspaceSettings, {
    onSave: saveWorkspaceSettings,
    enabled: hasEditedWorkspaceSettings && Boolean(activeOrgId),
    delayMs: 1000,
  });

  // Until the org-locations query has loaded, fall back to the locations the
  // active-location context already knows about.
  const locationRows = locationsQuery.isSuccess
    ? (locationsQuery.data ?? []).map(locationToDetailItem)
    : locations;

  const openCreateLocation = () => {
    setEditingLocation(null);
    setLocationDialogOpen(true);
  };

  const openEditLocation = (location: LocationDetailItem) => {
    setEditingLocation(location);
    setLocationDialogOpen(true);
  };

  const handleSaveLocation = async (values: Record<string, FormFieldValue>) => {
    const input = formValuesToLocationInput(values);
    if (!input.name) throw new Error('Site name is required.');
    // mutateAsync rejects on failure so the dialog stays open; the toast is
    // raised by the mutation's onError.
    await locationMutations.saveLocation.mutateAsync({
      id: editingLocation?.id ?? null,
      input,
    });
  };

  const handleDeactivateLocation = async (location: LocationDetailItem) => {
    try {
      await locationMutations.deactivateLocation.mutateAsync(location.id);
    } catch {
      /* surfaced by the mutation's onError toast */
    }
  };

  const settingsSections: SettingsSectionConfig[] = [
    {
      id: 'account',
      label: 'Account',
      group: 'Account',
      icon: <UserCircleIcon size={16} weight="duotone" />,
      title: 'Account',
      sectionDescription: 'Your name, sign-in details, and password.',
      render: () => <AccountSettingsSection />,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      group: 'Account',
      icon: <NotificationsIcon size={16} weight="duotone" />,
      title: 'Notifications',
      sectionDescription: 'Choose how Oktavius keeps you informed.',
      render: () => <NotificationSettingsSection runtime={osirisRuntime?.notificationsRuntime} />,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      group: 'Account',
      icon: <SlidersHorizontalIcon size={16} weight="duotone" />,
      title: 'Appearance',
      sectionDescription: 'Personal display preferences for this device.',
      render: () => (
        <SettingsSection title="Appearance">
          <SettingsRow
            label="Compact sidebar"
            description="Keep the app navigation rail icon-only on list pages."
          >
            <Switch checked={isSidebarCollapsed} onCheckedChange={setSidebarCollapsed} />
          </SettingsRow>
          <SettingsRow label="Interface language" description="Labels and navigation copy.">
            <LanguageSelector />
          </SettingsRow>
        </SettingsSection>
      ),
    },
    {
      id: 'localization',
      label: 'Localization',
      group: 'Workspace',
      icon: <GlobeIcon size={16} weight="duotone" />,
      title: 'Localization',
      sectionDescription: 'Date, time, and timezone defaults applied across the workspace.',
      render: () => (
        <div className="space-y-8">
          <SettingsSection title="Localization">
            <SettingsRow
              label="Date format"
              description="Default date display across this workspace."
            >
              <Combobox
                value={workspaceSettings.dateTime.dateFormat}
                onChange={(value) => {
                  if (value) updateWorkspaceDateTime('dateFormat', value);
                }}
                options={DATE_FORMAT_OPTIONS}
                className={CONTROL_WIDTH}
              />
            </SettingsRow>
            <SettingsRow
              label="Time format"
              description="Default time display across this workspace."
            >
              <Combobox
                value={workspaceSettings.dateTime.timeFormat}
                onChange={(value) => {
                  if (value) updateWorkspaceDateTime('timeFormat', value);
                }}
                options={TIME_FORMAT_OPTIONS}
                className={CONTROL_WIDTH}
              />
            </SettingsRow>
            <SettingsRow label="Timezone" description="Used for backend-generated timestamps.">
              <Combobox
                value={workspaceSettings.dateTime.timezone}
                onChange={(value) => {
                  if (value) updateWorkspaceDateTime('timezone', value);
                }}
                options={TIMEZONE_OPTIONS}
                className={CONTROL_WIDTH}
              />
            </SettingsRow>
          </SettingsSection>
          <SettingsAutosaveFooter
            saving={isSavingWorkspaceSettings}
            savedAt={workspaceSettingsSavedAt}
          />
        </div>
      ),
    },
    {
      id: 'organization',
      group: 'Workspace',
      label: t('settings.orgSettings', undefined, 'Organization Settings'),
      icon: <OrganizationIcon size={16} weight="duotone" />,
      title: t('settings.orgSettings', undefined, 'Organization Settings'),
      sectionDescription: t(
        'settings.orgSettingsRouteDescription',
        undefined,
        'Manage company profile, invoicing defaults, and legal details for your active organization.',
      ),
      permission: 'org.manage',
      render: () => (
        <OrganizationSettingsSection
          settings={workspaceSettings}
          saving={isSavingWorkspaceSettings}
          savedAt={workspaceSettingsSavedAt}
          onChange={handleWorkspaceSettingsChange}
        />
      ),
    },
    {
      id: 'people',
      group: 'Workspace',
      label: 'People',
      icon: <TeamIcon size={16} weight="duotone" />,
      title: 'People',
      sectionDescription: 'Members, pending invitations, and invite links for this workspace.',
      permission: 'org.members.manage',
      render: () => <MembersPeopleSection />,
    },
    {
      id: 'roles',
      group: 'Workspace',
      label: 'Roles',
      icon: <LockIcon size={16} weight="duotone" />,
      title: 'Custom roles',
      sectionDescription: 'Organization-specific permission roles.',
      permission: 'org.members.manage',
      render: () => <MembersRolesSection />,
    },
    {
      id: 'ai',
      group: 'Workspace',
      label: 'Agent',
      icon: <BrainIcon size={16} weight="duotone" />,
      title: 'Agent',
      sectionDescription: 'Usage guardrails and org-wide instructions for AI-assisted work.',
      permission: 'org.manage',
      render: () => (
        <AiSettingsSection
          settings={workspaceSettings}
          saving={isSavingWorkspaceSettings}
          savedAt={workspaceSettingsSavedAt}
          onChange={handleWorkspaceSettingsChange}
        />
      ),
    },
    {
      id: 'locations',
      group: 'Workspace',
      label: 'Locations',
      icon: <LocationIcon size={16} weight="duotone" />,
      title: 'Locations',
      sectionDescription:
        'Manage organization locations and control where location-owned data is created and visible.',
      render: () => (
        <div className="space-y-5">
          <LocationPolicySettingsSection
            settings={workspaceSettings}
            saving={isSavingWorkspaceSettings}
            savedAt={workspaceSettingsSavedAt}
            onChange={handleWorkspaceSettingsChange}
          />
          <div>
            {osirisRuntime?.createOrgLocation ? (
              <div className="mb-3 flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={openCreateLocation}>
                  <PlusIcon size={14} aria-hidden="true" />
                  {ADD_LOCATION_LABEL}
                </Button>
              </div>
            ) : null}
            <WorkspaceLocationsOverview
              locations={locationRows}
              onEdit={osirisRuntime?.updateOrgLocation ? openEditLocation : undefined}
              onDeactivate={
                osirisRuntime?.updateOrgLocation
                  ? (location) => void handleDeactivateLocation(location)
                  : undefined
              }
            />
          </div>
        </div>
      ),
    },
    {
      id: 'mail',
      group: 'Workspace',
      label: t('settings.mailTab', undefined, 'Mail'),
      icon: <EmailIcon size={16} weight="duotone" />,
      title: t('settings.mailSettingsTitle', undefined, 'Mail'),
      sectionDescription: t(
        'settings.mailSettingsDescription',
        undefined,
        'Connect a mail provider to sync your mailbox and send email from Oktavius.',
      ),
      permission: 'org.manage',
      render: () => <MailSettingsSection />,
    },
    {
      id: 'whatsapp',
      group: 'Workspace',
      label: t('settings.whatsappTab', undefined, 'WhatsApp'),
      icon: <WhatsAppIcon size={16} weight="duotone" />,
      title: t('settings.whatsappSettingsTitle', undefined, 'WhatsApp'),
      sectionDescription: t(
        'settings.whatsappSettingsDescription',
        undefined,
        'Connect the WhatsApp bot, set messaging policies, and manage the contact allowlist.',
      ),
      permission: 'org.manage',
      render: () => <WhatsAppSettingsSection />,
    },
    {
      id: 'catalogs',
      group: 'Workspace',
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
      subtitle="Your account and workspace configuration"
      icon={settingsPageIcon()}
      layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}
    >
      <SettingsPageFactory
        sections={settingsSections}
        activeKey={activeSection}
        onActiveKeyChange={setActiveSection}
        groupOrder={['Account', 'Workspace']}
      />
      <SubEntityFormDialog<Record<string, FormFieldValue>>
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        title={editingLocation ? 'Edit location' : 'Add location'}
        description="Locations are used for branch filtering, defaults, and site-specific records."
        fields={locationFormFields}
        defaultValues={locationToFormValues(editingLocation)}
        submitLabel={editingLocation ? 'Save' : 'Create'}
        isSubmitting={locationMutations.saveLocation.isPending}
        onSubmit={handleSaveLocation}
      />
    </ModulePage>
  );
}
