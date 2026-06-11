import { joinOsirisApiBaseUrl } from './apiBaseUrl';

export type OsirisAuthClientOptions = {
  baseUrl?: string;
};

export type OsirisPasswordLoginInput = {
  email: string;
  password: string;
};

export type OsirisAuthProviderName = 'google' | 'azure';

export type OsirisProviderLoginInput = {
  provider: OsirisAuthProviderName;
  redirectTo?: string | null;
};

export type OsirisProviderLoginResponse = {
  url: string;
};

export type OsirisProviderSessionInput = {
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number | null;
  expiresAt?: number | null;
};

export type OsirisPasswordResetInput = {
  email: string;
};

export type OsirisRecoveryPasswordInput = {
  accessToken: string;
  password: string;
};

export type OsirisPasswordChangeInput = {
  currentPassword: string;
  newPassword: string;
};

export type OsirisProfileUpdateInput = {
  fullName: string;
};

export type OsirisInvitationResolution = {
  kind: 'email_invitation' | 'invite_link';
  email: string | null;
  status?: 'pending' | 'already_accepted';
};

export type OsirisAcceptedInvitation = {
  kind: 'email_invitation' | 'invite_link';
  orgId: string;
  role: 'admin' | 'member' | 'viewer';
  customRoleId?: string | null;
  acceptedAt?: string;
  alreadyMember?: boolean;
};

export type OsirisInvitationTokenInput = {
  token: string;
};

export type OsirisRegisterInvitationInput = OsirisInvitationTokenInput & {
  password: string;
  fullName?: string;
};

export type OsirisPasswordLoginResponse = {
  user: {
    id: string;
    email: string | null;
  };
  expiresAt: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

async function readErrorMessage(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) return fallback;

  try {
    const payload: unknown = JSON.parse(text);
    if (isRecord(payload)) {
      if (isRecord(payload.error) && typeof payload.error.message === 'string') {
        return payload.error.message;
      }
      if (typeof payload.message === 'string') {
        return payload.message;
      }
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function createOsirisAuthClient(options: OsirisAuthClientOptions = {}) {
  return {
    async signInWithPassword(
      input: OsirisPasswordLoginInput,
    ): Promise<OsirisPasswordLoginResponse> {
      const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, '/auth/login'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Sign in failed.'));
      }

      return (await response.json()) as OsirisPasswordLoginResponse;
    },

    async requestPasswordReset(input: OsirisPasswordResetInput): Promise<void> {
      const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, '/auth/password/reset'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Password reset failed.'));
      }
    },

    async updateRecoveryPassword(input: OsirisRecoveryPasswordInput): Promise<void> {
      const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, '/auth/password/update'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Password update failed.'));
      }
    },

    async changePassword(input: OsirisPasswordChangeInput): Promise<void> {
      const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, '/auth/password/change'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Password change failed.'));
      }
    },

    async updateProfile(input: OsirisProfileUpdateInput): Promise<void> {
      const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, '/me/profile'), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Profile update failed.'));
      }
    },

    async updatePreferredLanguage(language: string): Promise<void> {
      const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, '/i18n/user/language'), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Language update failed.'));
      }
    },

    async resolveInvitationToken(token: string): Promise<OsirisInvitationResolution> {
      const response = await fetch(
        joinOsirisApiBaseUrl(options.baseUrl, `/invitations/resolve/${encodeURIComponent(token)}`),
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Invitation not found.'));
      }

      return (await response.json()) as OsirisInvitationResolution;
    },

    async acceptInvitation(input: OsirisInvitationTokenInput): Promise<OsirisAcceptedInvitation> {
      const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, '/invitations/accept'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Invitation acceptance failed.'));
      }

      return (await response.json()) as OsirisAcceptedInvitation;
    },

    async registerInvitation(input: OsirisRegisterInvitationInput): Promise<void> {
      const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, '/invitations/register'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Invitation signup failed.'));
      }
    },

    async startProviderSignIn(
      input: OsirisProviderLoginInput,
    ): Promise<OsirisProviderLoginResponse> {
      const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, '/auth/oauth/start'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Provider sign in failed.'));
      }

      return (await response.json()) as OsirisProviderLoginResponse;
    },

    async completeProviderSignIn(
      input: OsirisProviderSessionInput,
    ): Promise<OsirisPasswordLoginResponse> {
      const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, '/auth/session'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Provider session failed.'));
      }

      return (await response.json()) as OsirisPasswordLoginResponse;
    },

    async signOut(): Promise<void> {
      const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, '/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok && response.status !== 401) {
        throw new Error(
          await readErrorMessage(response, `Sign out failed with ${response.status}`),
        );
      }
    },

    async refreshSession(): Promise<OsirisPasswordLoginResponse> {
      const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, '/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Session refresh failed.'));
      }

      return (await response.json()) as OsirisPasswordLoginResponse;
    },
  };
}
