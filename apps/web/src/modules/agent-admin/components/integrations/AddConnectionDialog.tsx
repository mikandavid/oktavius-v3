import {
  Button,
  Combobox,
  type ComboboxOption,
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  StatusDot,
} from '@oktavius/base-ui';
import { cn } from '@oktavius/base-ui';
import React, { useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { ChevronLeftIcon, SpinnerIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';
import {
  useCreateIntegrationConnection,
  useFinalizeIntegrationConnection,
  useNativeIntegrations,
  useProviderDiagnostics,
  useSearchIntegrationApps,
} from '@/modules/agent-admin/data/useAgentIntegrations';
import {
  type AgentIntegrationPermissionMode,
  type AgentIntegrationSummary,
  type IntegrationGrant,
  type PipedreamApp,
} from '@/runtime/osiris/agentIntegrationsClient';

import { NATIVE_INTEGRATION_LOGOS } from './connectionPresentation';
import { NativeIntegrationForm } from './NativeIntegrationForm';
import { launchPipedreamConnect } from './pipedreamConnect';
import { ShareAudienceControl } from './ShareAudienceControl';

// ---------------------------------------------------------------------------
// Inline useDebouncedValue (not available in v3)
// ---------------------------------------------------------------------------

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Inline EntityAvatar (not available in v3 yet)
// ---------------------------------------------------------------------------

type EntityAvatarSize = 'xs' | 'sm' | 'md';
type EntityAvatarTone = 'muted' | 'primary';

interface EntityAvatarProps {
  label: string;
  src?: string | null;
  size?: EntityAvatarSize;
  tone?: EntityAvatarTone;
  className?: string;
}

const AVATAR_SIZE: Record<EntityAvatarSize, string> = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
};

const AVATAR_TONE: Record<EntityAvatarTone, string> = {
  muted: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
};

function entityInitials(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return '·';
  const tokens = trimmed.split(/\s+/);
  return (
    tokens
      .filter(Boolean)
      .slice(0, 2)
      .map((t) => t.charAt(0).toUpperCase())
      .join('') || trimmed.charAt(0).toUpperCase()
  );
}

function EntityAvatar({ label, src, size = 'md', tone = 'muted', className }: EntityAvatarProps) {
  const text = entityInitials(label);
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold leading-none select-none',
        AVATAR_SIZE[size],
        AVATAR_TONE[tone],
        className,
      )}
      aria-label={label}
      role="img"
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            (event.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span aria-hidden>{text}</span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Dialog types
// ---------------------------------------------------------------------------

type DialogStep =
  | { kind: 'pick' }
  | { kind: 'configure'; app: PipedreamApp }
  | { kind: 'native'; integration: AgentIntegrationSummary };

interface AddConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
}

/**
 * Guided connect flow: search apps (Pipedream catalog plus direct integrations for
 * admins), then configure name, agent access, and sharing before launching OAuth.
 */
export function AddConnectionDialog({ open, onOpenChange, isAdmin }: AddConnectionDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<DialogStep>({ kind: 'pick' });
  const [query, setQuery] = useState('');

  function close() {
    onOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setStep({ kind: 'pick' });
      setQuery('');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step.kind !== 'pick' ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-ml-2 h-7 w-7"
                aria-label={t('settings.integrationBackToSearch')}
                onClick={() => setStep({ kind: 'pick' })}
              >
                <ChevronLeftIcon className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
            {step.kind === 'configure'
              ? step.app.name
              : step.kind === 'native'
                ? step.integration.name
                : t('settings.integrationAddConnection')}
          </DialogTitle>
          {step.kind === 'pick' ? (
            <DialogDescription>{t('settings.integrationAddDescription')}</DialogDescription>
          ) : null}
        </DialogHeader>
        {step.kind === 'pick' ? (
          <AppPicker
            isAdmin={isAdmin}
            query={query}
            onQueryChange={setQuery}
            onPickApp={(app) => setStep({ kind: 'configure', app })}
            onPickNative={(integration) => setStep({ kind: 'native', integration })}
          />
        ) : null}
        {step.kind === 'configure' ? (
          <ConfigureConnection app={step.app} isAdmin={isAdmin} onDone={close} />
        ) : null}
        {step.kind === 'native' ? (
          <NativeIntegrationForm integration={step.integration} onDone={close} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface AppPickerProps {
  isAdmin: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onPickApp: (app: PipedreamApp) => void;
  onPickNative: (integration: AgentIntegrationSummary) => void;
}

function AppPicker({ isAdmin, query, onQueryChange, onPickApp, onPickNative }: AppPickerProps) {
  const { t } = useTranslation();
  const diagnostics = useProviderDiagnostics();
  const nativeQuery = useNativeIntegrations(isAdmin);
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const pipedreamEnabled = diagnostics.data?.pipedream.enabled === true;
  const searchEnabled = pipedreamEnabled && debouncedQuery.length >= 2;
  const appsQuery = useSearchIntegrationApps(debouncedQuery, searchEnabled);

  const nativeIntegrations = (nativeQuery.data?.integrations ?? []).filter((integration) =>
    integration.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const apps = searchEnabled ? (appsQuery.data?.apps ?? []) : [];
  const searching = searchEnabled && appsQuery.isLoading;

  return (
    <Command shouldFilter={false} className="rounded-md border">
      <CommandInput
        value={query}
        onValueChange={onQueryChange}
        placeholder={t('settings.integrationSearchPlaceholder')}
        autoFocus
      />
      <CommandList className="max-h-80">
        {nativeIntegrations.length > 0 ? (
          <CommandGroup heading={t('settings.integrationDirectGroup')}>
            {nativeIntegrations.map((integration) => (
              <PickerItem
                key={integration.key}
                value={`native:${integration.key}`}
                label={integration.name}
                description={integration.description}
                imgSrc={NATIVE_INTEGRATION_LOGOS[integration.key]}
                trailing={
                  integration.connectionStatus === 'connected' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <StatusDot tone="success" size="xs" />
                      {t('settings.agentIntegrationsStatus.connected')}
                    </span>
                  ) : null
                }
                onSelect={() => onPickNative(integration)}
              />
            ))}
          </CommandGroup>
        ) : null}
        {pipedreamEnabled ? (
          <CommandGroup heading={t('settings.integrationAppsGroup')}>
            {searching ? (
              <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                <SpinnerIcon className="h-4 w-4 animate-spin" aria-hidden />
                {t('common.loading')}
              </div>
            ) : null}
            {apps.map((app) => (
              <PickerItem
                key={app.nameSlug}
                value={`app:${app.nameSlug}`}
                label={app.name}
                description={app.description}
                imgSrc={app.imgSrc}
                onSelect={() => onPickApp(app)}
              />
            ))}
            {!searching && apps.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                {debouncedQuery.length >= 2
                  ? t('settings.integrationNoAppsFound')
                  : t('settings.integrationSearchHint')}
              </div>
            ) : null}
          </CommandGroup>
        ) : (
          <div className="px-3 py-3 text-sm text-muted-foreground">
            {t('settings.integrationProviderUnavailable')}
          </div>
        )}
      </CommandList>
    </Command>
  );
}

interface PickerItemProps {
  value: string;
  label: string;
  description?: string;
  imgSrc?: string;
  trailing?: React.ReactNode;
  onSelect: () => void;
}

function PickerItem({ value, label, description, imgSrc, trailing, onSelect }: PickerItemProps) {
  return (
    <CommandItem value={value} onSelect={onSelect} className="gap-2.5 py-2">
      <EntityAvatar label={label} src={imgSrc} size="sm" tone="muted" className="rounded-md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{label}</span>
        {description ? (
          <span className="block truncate text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
      {trailing}
    </CommandItem>
  );
}

const PERMISSION_MODE_OPTIONS: ComboboxOption[] = [
  { value: 'read', label: 'Read only' },
  { value: 'full', label: 'Full access' },
];

interface ConfigureConnectionProps {
  app: PipedreamApp;
  isAdmin: boolean;
  onDone: () => void;
}

function ConfigureConnection({ app, isAdmin, onDone }: ConfigureConnectionProps) {
  const { t } = useTranslation();
  const createConnection = useCreateIntegrationConnection();
  const finalizeConnection = useFinalizeIntegrationConnection();
  const [displayName, setDisplayName] = useState(app.name);
  const [permissionMode, setPermissionMode] = useState<AgentIntegrationPermissionMode>('read');
  const [grants, setGrants] = useState<IntegrationGrant[]>([]);
  const [authorizing, setAuthorizing] = useState(false);

  const pending = createConnection.isPending || finalizeConnection.isPending || authorizing;

  async function handleConnect() {
    if (!displayName.trim()) {
      appToast.error(t('settings.integrationConnectionRequired'));
      return;
    }
    try {
      const attempt = await createConnection.mutateAsync({
        provider: 'pipedream',
        appKey: app.nameSlug,
        displayName: displayName.trim(),
        visibility: grants.length > 0 ? 'shared' : 'private',
        permissionMode,
        grants,
      });
      // Dismiss our modal before Pipedream mounts its iframe on document.body.
      // Radix modal dialogs mark outside nodes inert, which blocks iframe clicks.
      onDone();
      setAuthorizing(true);
      await launchPipedreamConnect({
        attempt,
        appKey: app.nameSlug,
        onSuccess: (accountId) => {
          void finalizeConnection
            .mutateAsync({ attemptToken: attempt.attemptToken, accountId })
            .then(() => {
              appToast.success(t('settings.integrationConnected'));
            })
            .catch((error: unknown) => {
              appToast.error(error instanceof Error ? error.message : t('common.genericError'));
            })
            .finally(() => setAuthorizing(false));
        },
        onError: (error) => {
          setAuthorizing(false);
          appToast.error(error.message);
        },
      });
    } catch (error) {
      setAuthorizing(false);
      appToast.error(error instanceof Error ? error.message : t('common.genericError'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-2.5">
        <EntityAvatar label={app.name} src={app.imgSrc} size="md" className="rounded-md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{app.name}</p>
          {app.description ? (
            <p className="truncate text-xs text-muted-foreground">{app.description}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="connection-display-name">{t('settings.integrationAccountName')}</Label>
        <Input
          id="connection-display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t('settings.integrationAccessLevel')}</Label>
        <Combobox
          options={PERMISSION_MODE_OPTIONS.map((opt) => ({
            ...opt,
            label:
              opt.value === 'read'
                ? t('settings.integrationAccessRead')
                : t('settings.integrationAccessFull'),
          }))}
          value={permissionMode}
          onChange={(v) => v && setPermissionMode(v as AgentIntegrationPermissionMode)}
          clearable={false}
        />
        <p className="text-xs text-muted-foreground">
          {permissionMode === 'read'
            ? t('settings.agentIntegrationsReadDescription')
            : t('settings.agentIntegrationsFullDescription')}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label>{t('settings.integrationShareLabel')}</Label>
        {isAdmin ? (
          <>
            <ShareAudienceControl grants={grants} onChange={setGrants} />
            <p className="text-xs text-muted-foreground">{t('settings.integrationShareHint')}</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t('settings.integrationPrivateDescription')}
          </p>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="button" disabled={pending} onClick={() => void handleConnect()}>
          {pending ? <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
          {authorizing ? t('settings.integrationAuthorizing') : t('settings.integrationConnect')}
        </Button>
      </div>
    </div>
  );
}
