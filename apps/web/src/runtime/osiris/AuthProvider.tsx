import { type ReactNode, useCallback, useEffect, useState } from 'react';

import { createOsirisSavedViewsAdapter } from '@/components/data/osirisSavedViewsAdapter';

import { joinOsirisApiBaseUrl, resolveOsirisApiBaseUrl } from './apiBaseUrl';
import { createOsirisAuthClient } from './authClient';
import { normalizeOsirisBootstrap } from './bootstrap';
import { createOsirisLocationAdminClient } from './locationAdminClient';
import { createOsirisNotificationsRuntime } from './notificationsClient';
import { createOsirisSearchRuntime } from './searchClient';
import type { OsirisBootstrapResponse, OsirisRuntimeState, OsirisSessionStatus } from './types';
import { OsirisRuntimeContext } from './useOsirisRuntime';
import { createOsirisUserPreferencesRuntime } from './userPreferencesClient';
import { createOsirisWorkspaceSettingsClient } from './workspaceSettingsClient';

const OSIRIS_API_BASE_URL = resolveOsirisApiBaseUrl();
const osirisAuthClient = createOsirisAuthClient({ baseUrl: OSIRIS_API_BASE_URL });
const osirisWorkspaceSettingsClient = createOsirisWorkspaceSettingsClient({
  baseUrl: OSIRIS_API_BASE_URL,
});
const osirisLocationAdminClient = createOsirisLocationAdminClient({ baseUrl: OSIRIS_API_BASE_URL });
const osirisNotificationsRuntime = createOsirisNotificationsRuntime({
  baseUrl: OSIRIS_API_BASE_URL,
});
const osirisSearchRuntime = createOsirisSearchRuntime({ baseUrl: OSIRIS_API_BASE_URL });
const osirisSavedViewsRuntime = createOsirisSavedViewsAdapter({ baseUrl: OSIRIS_API_BASE_URL });
const osirisUserPreferencesRuntime = createOsirisUserPreferencesRuntime({
  baseUrl: OSIRIS_API_BASE_URL,
});

const EMPTY_STATE: OsirisRuntimeState = {
  sessionStatus: 'anonymous',
  currentUser: { id: '', email: null, fullName: null, isSuperadmin: false },
  organizations: [],
  memberships: [],
  activeOrgId: null,
  activeSiteId: null,
  permissions: [],
  permissionSubject: { isSuperadmin: false, role: null, permissions: [] },
  locationAccess: null,
  config: null,
};

class OsirisUnauthorizedError extends Error {
  constructor() {
    super('Osiris session is not authenticated.');
    this.name = 'OsirisUnauthorizedError';
  }
}

function isUnauthorizedError(error: unknown) {
  return error instanceof OsirisUnauthorizedError;
}

function withSessionStatus(
  state: OsirisRuntimeState,
  sessionStatus: OsirisSessionStatus,
): OsirisRuntimeState {
  return { ...state, sessionStatus };
}

async function fetchBootstrap(): Promise<OsirisBootstrapResponse> {
  const response = await fetch(joinOsirisApiBaseUrl(OSIRIS_API_BASE_URL, '/bootstrap'), {
    credentials: 'include',
  });
  if (response.status === 401) {
    throw new OsirisUnauthorizedError();
  }
  if (!response.ok) {
    throw new Error(`Bootstrap failed with ${response.status}`);
  }
  return (await response.json()) as OsirisBootstrapResponse;
}

async function postActiveContext({
  activeOrgId,
  activeSiteId,
}: {
  activeOrgId: string | null;
  activeSiteId: string | null;
}) {
  const response = await fetch(joinOsirisApiBaseUrl(OSIRIS_API_BASE_URL, '/me/active-context'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activeOrgId, activeSiteId }),
  });
  if (response.status === 401) {
    throw new OsirisUnauthorizedError();
  }
  if (!response.ok) {
    throw new Error(`Active context update failed with ${response.status}`);
  }
}

function requireOrgId(orgId: string | null | undefined): string {
  if (!orgId) throw new Error('An active workspace is required.');
  return orgId;
}

export function OsirisAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OsirisRuntimeState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const setSessionState = useCallback((sessionStatus: OsirisSessionStatus) => {
    setState(withSessionStatus(EMPTY_STATE, sessionStatus));
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setState(
        withSessionStatus(normalizeOsirisBootstrap(await fetchBootstrap()), 'authenticated'),
      );
      setError(null);
    } catch (nextError) {
      if (isUnauthorizedError(nextError)) {
        try {
          await osirisAuthClient.refreshSession();
          setState(
            withSessionStatus(normalizeOsirisBootstrap(await fetchBootstrap()), 'authenticated'),
          );
          setError(null);
        } catch {
          setSessionState('anonymous');
          setError(null);
        }
      } else {
        setError(nextError instanceof Error ? nextError : new Error(String(nextError)));
      }
    } finally {
      setIsLoading(false);
    }
  }, [setSessionState]);

  const updateActiveContext = useCallback(
    async (activeOrgId: string | null, activeSiteId: string | null) => {
      try {
        await postActiveContext({ activeOrgId, activeSiteId });
        setState(
          withSessionStatus(normalizeOsirisBootstrap(await fetchBootstrap()), 'authenticated'),
        );
        setError(null);
      } catch (nextError) {
        if (isUnauthorizedError(nextError)) {
          setSessionState('expired');
          setError(null);
          throw nextError;
        }
        const resolvedError = nextError instanceof Error ? nextError : new Error(String(nextError));
        setError(resolvedError);
        throw resolvedError;
      }
    },
    [setSessionState],
  );

  const setActiveOrgId = useCallback(
    (orgId: string | null) => updateActiveContext(orgId, null),
    [updateActiveContext],
  );

  const setActiveSiteId = useCallback(
    (siteId: string | null) => updateActiveContext(state.activeOrgId, siteId),
    [state.activeOrgId, updateActiveContext],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        await osirisAuthClient.signInWithPassword({ email, password });
        setState(
          withSessionStatus(normalizeOsirisBootstrap(await fetchBootstrap()), 'authenticated'),
        );
        setError(null);
      } catch (nextError) {
        if (isUnauthorizedError(nextError)) {
          setSessionState('anonymous');
          setError(null);
          throw new Error('Sign in did not establish an active session.');
        } else {
          const resolvedError =
            nextError instanceof Error ? nextError : new Error(String(nextError));
          setError(resolvedError);
          throw resolvedError;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [setSessionState],
  );

  const signInWithProvider = useCallback(
    async (provider: 'google' | 'azure', redirectTo?: string | null) => {
      const { url } = await osirisAuthClient.startProviderSignIn({ provider, redirectTo });
      window.location.assign(url);
    },
    [],
  );

  const completeProviderSignIn = useCallback(
    async (session: Parameters<typeof osirisAuthClient.completeProviderSignIn>[0]) => {
      setIsLoading(true);
      try {
        await osirisAuthClient.completeProviderSignIn(session);
        setState(
          withSessionStatus(normalizeOsirisBootstrap(await fetchBootstrap()), 'authenticated'),
        );
        setError(null);
      } catch (nextError) {
        const resolvedError = nextError instanceof Error ? nextError : new Error(String(nextError));
        setSessionState('anonymous');
        setError(resolvedError);
        throw resolvedError;
      } finally {
        setIsLoading(false);
      }
    },
    [setSessionState],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    await osirisAuthClient.requestPasswordReset({ email });
  }, []);

  const updateRecoveryPassword = useCallback(
    async (input: { accessToken: string; password: string }) => {
      await osirisAuthClient.updateRecoveryPassword(input);
    },
    [],
  );

  const changePassword = useCallback(
    async (input: Parameters<typeof osirisAuthClient.changePassword>[0]) => {
      await osirisAuthClient.changePassword(input);
      setError(null);
    },
    [],
  );

  const updateProfile = useCallback(
    async (input: Parameters<typeof osirisAuthClient.updateProfile>[0]) => {
      await osirisAuthClient.updateProfile(input);
      setState(
        withSessionStatus(normalizeOsirisBootstrap(await fetchBootstrap()), 'authenticated'),
      );
      setError(null);
    },
    [],
  );

  const updatePreferredLanguage = useCallback(async (language: string) => {
    await osirisAuthClient.updatePreferredLanguage(language);
    setState((current) => ({
      ...current,
      currentUser: {
        ...current.currentUser,
        preferredLanguage: language,
      },
    }));
    setError(null);
  }, []);

  const loadWorkspaceSettings = useCallback(
    async (orgId?: string | null) => {
      return osirisWorkspaceSettingsClient.loadWorkspaceSettings(
        requireOrgId(orgId ?? state.activeOrgId),
      );
    },
    [state.activeOrgId],
  );

  const updateWorkspaceSettings = useCallback(
    async (
      settings: Parameters<typeof osirisWorkspaceSettingsClient.updateWorkspaceSettings>[1],
      orgId?: string | null,
    ) => {
      const saved = await osirisWorkspaceSettingsClient.updateWorkspaceSettings(
        requireOrgId(orgId ?? state.activeOrgId),
        settings,
      );
      setState(
        withSessionStatus(normalizeOsirisBootstrap(await fetchBootstrap()), 'authenticated'),
      );
      setError(null);
      return saved;
    },
    [state.activeOrgId],
  );

  const listOrgLocations = useCallback(
    async (orgId?: string | null) => {
      return osirisLocationAdminClient.listOrgLocations(requireOrgId(orgId ?? state.activeOrgId));
    },
    [state.activeOrgId],
  );

  const createOrgLocation = useCallback(
    async (
      orgId: string | null | undefined,
      input: Parameters<typeof osirisLocationAdminClient.createOrgLocation>[1],
    ) => {
      const created = await osirisLocationAdminClient.createOrgLocation(
        requireOrgId(orgId ?? state.activeOrgId),
        input,
      );
      setState(
        withSessionStatus(normalizeOsirisBootstrap(await fetchBootstrap()), 'authenticated'),
      );
      setError(null);
      return created;
    },
    [state.activeOrgId],
  );

  const updateOrgLocation = useCallback(
    async (
      orgId: string | null | undefined,
      locationId: string,
      input: Parameters<typeof osirisLocationAdminClient.updateOrgLocation>[2],
    ) => {
      const saved = await osirisLocationAdminClient.updateOrgLocation(
        requireOrgId(orgId ?? state.activeOrgId),
        locationId,
        input,
      );
      setState(
        withSessionStatus(normalizeOsirisBootstrap(await fetchBootstrap()), 'authenticated'),
      );
      setError(null);
      return saved;
    },
    [state.activeOrgId],
  );

  const deactivateOrgLocation = useCallback(
    async (orgId: string | null | undefined, locationId: string) => {
      const saved = await osirisLocationAdminClient.deactivateOrgLocation(
        requireOrgId(orgId ?? state.activeOrgId),
        locationId,
      );
      setState(
        withSessionStatus(normalizeOsirisBootstrap(await fetchBootstrap()), 'authenticated'),
      );
      setError(null);
      return saved;
    },
    [state.activeOrgId],
  );

  const resolveInvitationToken = useCallback(async (token: string) => {
    return osirisAuthClient.resolveInvitationToken(token);
  }, []);

  const acceptInvitation = useCallback(async (token: string) => {
    return osirisAuthClient.acceptInvitation({ token });
  }, []);

  const registerInvitation = useCallback(
    async (input: Parameters<typeof osirisAuthClient.registerInvitation>[0]) => {
      await osirisAuthClient.registerInvitation(input);
    },
    [],
  );

  const expireSession = useCallback(() => {
    setSessionState('expired');
    setError(null);
    setIsLoading(false);
  }, [setSessionState]);

  const signOut = useCallback(async () => {
    await osirisAuthClient.signOut();
    setSessionState('anonymous');
    setError(null);
    setIsLoading(false);
  }, [setSessionState]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <OsirisRuntimeContext.Provider
      value={{
        ...state,
        setActiveOrgId,
        setActiveSiteId,
        signIn,
        signInWithProvider,
        completeProviderSignIn,
        requestPasswordReset,
        updateRecoveryPassword,
        changePassword,
        updateProfile,
        updatePreferredLanguage,
        loadWorkspaceSettings,
        updateWorkspaceSettings,
        listOrgLocations,
        createOrgLocation,
        updateOrgLocation,
        deactivateOrgLocation,
        resolveInvitationToken,
        acceptInvitation,
        registerInvitation,
        signOut,
        expireSession,
        notificationsRuntime: osirisNotificationsRuntime,
        searchRuntime: osirisSearchRuntime,
        savedViewsRuntime: osirisSavedViewsRuntime,
        userPreferencesRuntime: osirisUserPreferencesRuntime,
        isLoading,
        error,
        reload,
      }}
    >
      {children}
    </OsirisRuntimeContext.Provider>
  );
}
