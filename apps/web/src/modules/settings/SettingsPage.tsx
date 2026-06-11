import { useEffect, useMemo, useState } from 'react';

import { Button, Combobox, SettingsRow, Switch } from '@oktavius/base-ui';

import { createConfiguredCatalogOptionsStore } from '@/api/apiStoreConfig';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { ModulePage } from '@/components/common/PageLayout';
import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import type { FormField, FormFieldValue } from '@/components/forms/EntityForm';
import { useAppShellLayout } from '@/components/layout/AppShellLayoutContext';
import {
  CatalogOptionsManager,
  type CatalogOption,
} from '@/components/settings/CatalogOptionsManager';
import {
  SettingsPageFactory,
  type SettingsSectionConfig,
} from '@/components/settings/SettingsPageFactory';
import { WorkspaceLocationsOverview } from '@/components/settings/WorkspaceLocationsOverview';
import { useActiveLocation } from '@/lib/locations/ActiveLocationContext';
import type { LocationDetailItem } from '@/lib/locations/types';
import {
  DocumentIcon,
  LocationIcon,
  NotificationsIcon,
  PlusIcon,
  Settings2Icon,
} from '@/lib/icons';
import { getWindowStorage } from '@/lib/storage/safeStorage';
import { settingsPageIcon } from '@/lib/modulePageIcons';
import { appToast } from '@/lib/toast';
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

const SAVE_WORKSPACE_SETTINGS_LABEL = 'Save workspace settings';
const LOCATIONS_TITLE = 'Locations';
const LOCATIONS_DESCRIPTION = 'Branches and sites available in the active workspace.';
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
  const { locations } = useActiveLocation();
  const osirisRuntime = useOptionalOsirisRuntime();
  const activeOrgId = osirisRuntime?.activeOrgId ?? null;
  const { isSidebarCollapsed, setSidebarCollapsed } = useAppShellLayout();
  const [activeSection, setActiveSection] = useState('general');
  const [emailDigest, setEmailDigest] = useState(true);
  const [approvalAlerts, setApprovalAlerts] = useState(true);
  const [workspaceSettings, setWorkspaceSettings] = useState<OsirisWorkspaceSettings>(() =>
    createDefaultOsirisWorkspaceSettings(),
  );
  const [isSavingWorkspaceSettings, setIsSavingWorkspaceSettings] = useState(false);
  const [managedLocations, setManagedLocations] = useState<OsirisOrgLocation[]>([]);
  const [hasManagedLocationsResult, setHasManagedLocationsResult] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationDetailItem | null>(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
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

  useEffect(() => {
    if (!activeOrgId || !osirisRuntime?.listOrgLocations) {
      setManagedLocations([]);
      setHasManagedLocationsResult(false);
      return;
    }
    let cancelled = false;

    void osirisRuntime
      .listOrgLocations(activeOrgId)
      .then((loadedLocations) => {
        if (!cancelled) {
          setManagedLocations(loadedLocations);
          setHasManagedLocationsResult(true);
        }
      })
      .catch((error: unknown) => {
        appToast.fromApiError(error, 'Locations could not be loaded.');
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

  const updateWorkspaceDateTime = (
    key: keyof OsirisWorkspaceSettings['dateTime'],
    value: string,
  ) => {
    setWorkspaceSettings((current) => ({
      ...current,
      dateTime: {
        ...current.dateTime,
        [key]: value,
      },
    }));
  };

  const updateWorkspaceLocations = (
    key: keyof OsirisWorkspaceSettings['locations'],
    value: boolean | string[],
  ) => {
    setWorkspaceSettings((current) => ({
      ...current,
      locations: {
        ...current.locations,
        [key]: value,
      },
    }));
  };

  const handleSaveWorkspaceSettings = async () => {
    if (!activeOrgId || !osirisRuntime?.updateWorkspaceSettings) return;
    setIsSavingWorkspaceSettings(true);
    try {
      const saved = await osirisRuntime.updateWorkspaceSettings(workspaceSettings, activeOrgId);
      setWorkspaceSettings(saved);
      appToast.success('Workspace settings saved.');
    } catch (error) {
      appToast.fromApiError(error, 'Workspace settings could not be saved.');
    } finally {
      setIsSavingWorkspaceSettings(false);
    }
  };

  const locationRows = hasManagedLocationsResult
    ? managedLocations.map(locationToDetailItem)
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
    if (!activeOrgId || !osirisRuntime) return;
    const input = formValuesToLocationInput(values);
    if (!input.name) throw new Error('Site name is required.');

    setIsSavingLocation(true);
    try {
      const saved = editingLocation
        ? await osirisRuntime.updateOrgLocation?.(activeOrgId, editingLocation.id, input)
        : await osirisRuntime.createOrgLocation?.(activeOrgId, input);
      if (saved) {
        setManagedLocations((current) => {
          const exists = current.some((location) => location.id === saved.id);
          return exists
            ? current.map((location) => (location.id === saved.id ? saved : location))
            : [...current, saved];
        });
        setHasManagedLocationsResult(true);
      }
      appToast.success(editingLocation ? 'Location saved.' : 'Location created.');
    } catch (error) {
      appToast.fromApiError(error, 'Location could not be saved.');
      throw error;
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleDeactivateLocation = async (location: LocationDetailItem) => {
    if (!activeOrgId || !osirisRuntime?.updateOrgLocation) return;
    try {
      const saved = await osirisRuntime.updateOrgLocation(activeOrgId, location.id, {
        isActive: false,
      });
      setManagedLocations((current) =>
        current.map((entry) => (entry.id === saved.id ? saved : entry)),
      );
      appToast.success('Location deactivated.');
    } catch (error) {
      appToast.fromApiError(error, 'Location could not be deactivated.');
    }
  };

  const settingsSections: SettingsSectionConfig[] = [
    {
      id: 'general',
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
          <SettingsRow label="Date format" description="Default date display for this workspace.">
            <Combobox
              value={workspaceSettings.dateTime.dateFormat}
              onChange={(value) => {
                if (value) updateWorkspaceDateTime('dateFormat', value);
              }}
              options={DATE_FORMAT_OPTIONS}
              className="w-[220px]"
            />
          </SettingsRow>
          <SettingsRow label="Time format" description="Default time display for this workspace.">
            <Combobox
              value={workspaceSettings.dateTime.timeFormat}
              onChange={(value) => {
                if (value) updateWorkspaceDateTime('timeFormat', value);
              }}
              options={TIME_FORMAT_OPTIONS}
              className="w-[220px]"
            />
          </SettingsRow>
          <SettingsRow label="Timezone" description="Used for backend-generated timestamps.">
            <Combobox
              value={workspaceSettings.dateTime.timezone}
              onChange={(value) => {
                if (value) updateWorkspaceDateTime('timezone', value);
              }}
              options={TIMEZONE_OPTIONS}
              className="w-[220px]"
            />
          </SettingsRow>
          <SettingsRow
            label="Require locations"
            description="Records that support sites must be assigned to a location."
          >
            <Switch
              checked={workspaceSettings.locations.enforcementEnabled}
              onCheckedChange={(checked) => updateWorkspaceLocations('enforcementEnabled', checked)}
            />
          </SettingsRow>
          <div className="flex justify-end border-b border-border/50 py-3">
            <Button
              type="button"
              size="sm"
              aria-label="Save workspace settings"
              loading={isSavingWorkspaceSettings}
              onClick={() => void handleSaveWorkspaceSettings()}
            >
              {SAVE_WORKSPACE_SETTINGS_LABEL}
            </Button>
          </div>
          <div className="border-b border-border/50 py-3 last:border-b-0">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{LOCATIONS_TITLE}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{LOCATIONS_DESCRIPTION}</p>
              </div>
              {osirisRuntime?.createOrgLocation ? (
                <Button type="button" variant="outline" size="sm" onClick={openCreateLocation}>
                  <PlusIcon size={14} aria-hidden="true" />
                  {ADD_LOCATION_LABEL}
                </Button>
              ) : null}
            </div>
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
        </>
      ),
    },
    {
      id: 'locations',
      label: 'Locations',
      icon: <LocationIcon size={16} weight="duotone" />,
      title: 'Locations',
      sectionDescription: 'Manage branches and workspace site defaults.',
      render: () => (
        <WorkspaceLocationsOverview
          locations={locationRows}
          onEdit={osirisRuntime?.updateOrgLocation ? openEditLocation : undefined}
          onDeactivate={
            osirisRuntime?.updateOrgLocation
              ? (location) => void handleDeactivateLocation(location)
              : undefined
          }
        />
      ),
    },
    {
      id: 'notifications',
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
      id: 'catalogs',
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
      <SettingsPageFactory
        sections={settingsSections}
        activeKey={activeSection}
        onActiveKeyChange={setActiveSection}
      />
      <SubEntityFormDialog<Record<string, FormFieldValue>>
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        title={editingLocation ? 'Edit location' : 'Add location'}
        description="Locations are used for branch filtering, defaults, and site-specific records."
        fields={locationFormFields}
        defaultValues={locationToFormValues(editingLocation)}
        submitLabel={editingLocation ? 'Save' : 'Create'}
        isSubmitting={isSavingLocation}
        onSubmit={handleSaveLocation}
      />
    </ModulePage>
  );
}
