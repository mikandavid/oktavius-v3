import { Button, Combobox, type ComboboxOption, Input, Label } from '@oktavius/base-ui';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { appToast } from '@/lib/toast';
import {
  useConnectNativeIntegration,
  useDisconnectNativeIntegration,
  useTestNativeIntegration,
} from '@/modules/agent-admin/data/useAgentIntegrations';
import {
  type AgentIntegrationPermissionMode,
  type AgentIntegrationSummary,
} from '@/runtime/osiris/agentIntegrationsClient';

interface NativeIntegrationFormProps {
  integration: AgentIntegrationSummary;
  /** Called after a successful save or disconnect (e.g. to close the dialog). */
  onDone?: () => void;
}

const PERMISSION_MODE_OPTIONS: ComboboxOption[] = [
  { value: 'read', label: 'Read only' },
  { value: 'full', label: 'Full access' },
];

/**
 * Credential form for direct (non-Pipedream) integrations. Field set depends on the
 * integration: Halo uses an OAuth client (services) app, onOffice an API token pair.
 */
// fallow-ignore-next-line complexity
export function NativeIntegrationForm({ integration, onDone }: NativeIntegrationFormProps) {
  const { t } = useTranslation();
  const connect = useConnectNativeIntegration();
  const test = useTestNativeIntegration();
  const disconnect = useDisconnectNativeIntegration();
  const isHalo = integration.key === 'halo';

  const [authorizationServer, setAuthorizationServer] = useState('');
  const [baseUrl, setBaseUrl] = useState(integration.baseUrl ?? '');
  const [tenant, setTenant] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [permissionMode, setPermissionMode] = useState<AgentIntegrationPermissionMode>(
    integration.permissionMode,
  );

  const secretPlaceholder = integration.hasCredentials
    ? t('settings.agentIntegrationsSecretPlaceholder')
    : undefined;

  // fallow-ignore-next-line complexity
  async function handleSave() {
    if (!integration.hasCredentials && (!apiToken.trim() || !apiSecret.trim())) {
      appToast.error(t('settings.agentIntegrationsCredentialsRequired'));
      return;
    }
    if (isHalo && !integration.hasCredentials && (!authorizationServer.trim() || !baseUrl.trim())) {
      appToast.error(t('settings.agentIntegrationsHaloUrlsRequired'));
      return;
    }
    try {
      await connect.mutateAsync({
        key: integration.key,
        data: {
          permissionMode,
          ...(apiToken.trim() ? { apiToken: apiToken.trim() } : {}),
          ...(apiSecret.trim() ? { apiSecret: apiSecret.trim() } : {}),
          ...(baseUrl.trim() ? { baseUrl: baseUrl.trim() } : {}),
          ...(isHalo && authorizationServer.trim()
            ? { authorizationServer: authorizationServer.trim() }
            : {}),
          ...(isHalo && tenant.trim() ? { tenant: tenant.trim() } : {}),
        },
      });
      appToast.success(t('settings.agentIntegrationsSaved'));
      setApiToken('');
      setApiSecret('');
      onDone?.();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : t('common.genericError'));
    }
  }

  async function handleTest() {
    try {
      await test.mutateAsync(integration.key);
      appToast.success(t('settings.agentIntegrationsTestSuccess'));
    } catch (error) {
      appToast.error(
        error instanceof Error ? error.message : t('settings.agentIntegrationsTestFailed'),
      );
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect.mutateAsync(integration.key);
      appToast.success(t('settings.agentIntegrationsDisconnected'));
      onDone?.();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : t('common.genericError'));
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-muted-foreground">
        {isHalo ? t('settings.agentIntegrationsHaloHelp') : integration.description}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {isHalo ? (
          <div className="space-y-1.5">
            <Label htmlFor="native-auth-server">
              {t('settings.agentIntegrationsHaloAuthServer')}
            </Label>
            <Input
              id="native-auth-server"
              value={authorizationServer}
              onChange={(event) => setAuthorizationServer(event.target.value)}
              placeholder={secretPlaceholder ?? 'https://yourcompany.halopsa.com/auth'}
            />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="native-base-url">
            {isHalo
              ? t('settings.agentIntegrationsHaloResourceServer')
              : t('settings.agentIntegrationsBaseUrl')}
          </Label>
          <Input
            id="native-base-url"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder={isHalo ? 'https://yourcompany.halopsa.com/api' : undefined}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="native-api-token">
            {isHalo
              ? t('settings.agentIntegrationsHaloClientId')
              : t('settings.agentIntegrationsApiToken')}
          </Label>
          <Input
            id="native-api-token"
            value={apiToken}
            autoComplete="off"
            onChange={(event) => setApiToken(event.target.value)}
            placeholder={secretPlaceholder}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="native-api-secret">
            {isHalo
              ? t('settings.agentIntegrationsHaloClientSecret')
              : t('settings.agentIntegrationsApiSecret')}
          </Label>
          <Input
            id="native-api-secret"
            type="password"
            value={apiSecret}
            autoComplete="new-password"
            onChange={(event) => setApiSecret(event.target.value)}
            placeholder={secretPlaceholder}
          />
        </div>
        {isHalo ? (
          <div className="space-y-1.5">
            <Label htmlFor="native-tenant">{t('settings.agentIntegrationsHaloTenant')}</Label>
            <Input
              id="native-tenant"
              value={tenant}
              onChange={(event) => setTenant(event.target.value)}
            />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label>{t('settings.agentIntegrationsPermissionMode')}</Label>
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
        </div>
      </div>
      {integration.lastError ? (
        <p className="text-xs text-destructive">{integration.lastError}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {integration.hasCredentials ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={test.isPending}
              onClick={() => void handleTest()}
            >
              {t('settings.agentIntegrationsTest')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={disconnect.isPending}
              onClick={() => void handleDisconnect()}
            >
              {t('settings.agentIntegrationsDisconnect')}
            </Button>
          </>
        ) : null}
        <Button type="button" disabled={connect.isPending} onClick={() => void handleSave()}>
          {t('settings.agentIntegrationsSave')}
        </Button>
      </div>
    </div>
  );
}
