import { afterEach, describe, expect, it, vi } from 'vitest';

import { createOsirisAuthClient } from './authClient';

function jsonResponse(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('Osiris auth client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts password logins to the configured Osiris auth endpoint with cookies enabled', async () => {
    const fetch = vi.fn(async () =>
      jsonResponse({ user: { id: 'usr_1', email: 'anna@example.test' }, expiresAt: 1 }),
    );
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: 'https://api.example.test/v1' });
    await expect(
      client.signInWithPassword({
        email: 'anna@example.test',
        password: 'correct-password',
      }),
    ).resolves.toEqual({ user: { id: 'usr_1', email: 'anna@example.test' }, expiresAt: 1 });

    expect(fetch).toHaveBeenCalledWith('https://api.example.test/v1/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'anna@example.test', password: 'correct-password' }),
    });
  });

  it('clears backend sessions through the configured Osiris logout endpoint', async () => {
    const fetch = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: '/v1' });
    await client.signOut();

    expect(fetch).toHaveBeenCalledWith('/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  });

  it('refreshes backend sessions through the configured Osiris refresh endpoint', async () => {
    const fetch = vi.fn(async () =>
      jsonResponse({ user: { id: 'usr_1', email: 'anna@example.test' }, expiresAt: 1 }),
    );
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: '/v1' });
    await expect(client.refreshSession()).resolves.toEqual({
      user: { id: 'usr_1', email: 'anna@example.test' },
      expiresAt: 1,
    });

    expect(fetch).toHaveBeenCalledWith('/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
  });

  it('starts provider OAuth through the configured Osiris auth endpoint', async () => {
    const fetch = vi.fn(async () => jsonResponse({ url: 'https://auth.example.test/oauth' }));
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: '/v1' });
    await expect(
      client.startProviderSignIn({ provider: 'google', redirectTo: '/settings' }),
    ).resolves.toEqual({ url: 'https://auth.example.test/oauth' });

    expect(fetch).toHaveBeenCalledWith('/v1/auth/oauth/start', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'google', redirectTo: '/settings' }),
    });
  });

  it('completes provider OAuth sessions through the backend session endpoint', async () => {
    const fetch = vi.fn(async () =>
      jsonResponse({ user: { id: 'usr_1', email: 'anna@example.test' }, expiresAt: 1 }),
    );
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: '/v1' });
    await expect(
      client.completeProviderSignIn({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        expiresAt: 1,
      }),
    ).resolves.toEqual({ user: { id: 'usr_1', email: 'anna@example.test' }, expiresAt: 1 });

    expect(fetch).toHaveBeenCalledWith('/v1/auth/session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        expiresAt: 1,
      }),
    });
  });

  it('requests password reset emails through the backend auth endpoint', async () => {
    const fetch = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: '/v1' });
    await client.requestPasswordReset({ email: 'anna@example.test' });

    expect(fetch).toHaveBeenCalledWith('/v1/auth/password/reset', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'anna@example.test' }),
    });
  });

  it('updates recovery passwords through the backend auth endpoint', async () => {
    const fetch = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: '/v1' });
    await client.updateRecoveryPassword({
      accessToken: 'recovery-token',
      password: 'new-password-123',
    });

    expect(fetch).toHaveBeenCalledWith('/v1/auth/password/update', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'recovery-token', password: 'new-password-123' }),
    });
  });

  it('changes signed-in account passwords through the backend auth endpoint', async () => {
    const fetch = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: '/v1' });
    await client.changePassword({
      currentPassword: 'current-password',
      newPassword: 'new-password-123',
    });

    expect(fetch).toHaveBeenCalledWith('/v1/auth/password/change', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'current-password',
        newPassword: 'new-password-123',
      }),
    });
  });

  it('updates signed-in profile details through the backend profile endpoint', async () => {
    const fetch = vi.fn(async () => jsonResponse({ profile: { full_name: 'Anna Beispiel' } }));
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: '/v1' });
    await client.updateProfile({ fullName: 'Anna Beispiel' });

    expect(fetch).toHaveBeenCalledWith('/v1/me/profile', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Anna Beispiel' }),
    });
  });

  it('updates signed-in language preferences through the backend i18n endpoint', async () => {
    const fetch = vi.fn(async () => jsonResponse({ success: true, language: 'de' }));
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: '/v1' });
    await client.updatePreferredLanguage('de');

    expect(fetch).toHaveBeenCalledWith('/v1/i18n/user/language', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'de' }),
    });
  });

  it('resolves invitation tokens through the public backend endpoint', async () => {
    const fetch = vi.fn(async () =>
      jsonResponse({ kind: 'email_invitation', email: 'anna@example.test', status: 'pending' }),
    );
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: '/v1' });
    await expect(client.resolveInvitationToken('invite-token')).resolves.toEqual({
      kind: 'email_invitation',
      email: 'anna@example.test',
      status: 'pending',
    });

    expect(fetch).toHaveBeenCalledWith('/v1/invitations/resolve/invite-token', {
      credentials: 'include',
    });
  });

  it('accepts invitations through the authenticated backend endpoint', async () => {
    const fetch = vi.fn(async () =>
      jsonResponse({ kind: 'email_invitation', orgId: 'org_123', role: 'member' }),
    );
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: '/v1' });
    await expect(client.acceptInvitation({ token: 'invite-token' })).resolves.toEqual({
      kind: 'email_invitation',
      orgId: 'org_123',
      role: 'member',
    });

    expect(fetch).toHaveBeenCalledWith('/v1/invitations/accept', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invite-token' }),
    });
  });

  it('registers invited users through the public backend endpoint', async () => {
    const fetch = vi.fn(async () => jsonResponse({ userId: 'usr_123' }, { status: 201 }));
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: '/v1' });
    await client.registerInvitation({
      token: 'invite-token',
      password: 'new-password-123',
      fullName: 'Anna Beispiel',
    });

    expect(fetch).toHaveBeenCalledWith('/v1/invitations/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'invite-token',
        password: 'new-password-123',
        fullName: 'Anna Beispiel',
      }),
    });
  });

  it('surfaces backend auth messages from failed login attempts', async () => {
    const fetch = vi.fn(async () =>
      jsonResponse(
        { error: { message: 'Invalid email or password.' } },
        { status: 401, statusText: 'Unauthorized' },
      ),
    );
    vi.stubGlobal('fetch', fetch);

    const client = createOsirisAuthClient({ baseUrl: '/v1' });

    await expect(
      client.signInWithPassword({ email: 'anna@example.test', password: 'wrong-password' }),
    ).rejects.toThrow('Invalid email or password.');
  });
});
