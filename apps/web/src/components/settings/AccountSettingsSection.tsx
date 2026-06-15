import { Button, Input, SettingsRow, SettingsSection } from '@oktavius/base-ui';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { appToast } from '@/lib/toast';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

/** Personal account settings — display name, read-only identity, and password change. */
export function AccountSettingsSection() {
  const { t } = useTranslation();
  const osirisRuntime = useOptionalOsirisRuntime();
  const osirisUser = osirisRuntime?.currentUser;
  const userId = osirisUser?.id;
  const activeOrgId = osirisRuntime?.activeOrgId;
  const osirisOrganization = osirisRuntime?.organizations.find((org) => org.id === activeOrgId);
  const userName = osirisUser?.fullName ?? osirisUser?.email ?? 'User';
  const userEmail = osirisUser?.email ?? 'No email';
  const roleLabel = osirisRuntime?.permissionSubject.role ?? '—';
  const teamLabel = '—';
  const organizationName = osirisOrganization?.name ?? 'No active organization';

  const [fullName, setFullName] = useState(userName);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Reset the editable name only when a *different* user loads/switches — not on
  // every recompute of `userName`. A background runtime refresh recomputes
  // `userName` from `currentUser`; re-syncing on that would silently clobber an
  // in-progress edit (data loss). Identity-keyed reset still handles the
  // initial async load (undefined id → real id).
  const lastSyncedUserIdRef = useRef(userId);
  useEffect(() => {
    if (lastSyncedUserIdRef.current !== userId) {
      lastSyncedUserIdRef.current = userId;
      setFullName(userName);
    }
  }, [userId, userName]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed) {
      setProfileError('Full name is required.');
      return;
    }
    if (!osirisRuntime?.updateProfile) {
      setProfileError('Profile updates are not available in this runtime.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    try {
      await osirisRuntime.updateProfile({ fullName: trimmed });
      appToast.success('Profile updated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile could not be updated.';
      setProfileError(message);
      appToast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (!osirisRuntime?.changePassword) {
      setPasswordError('Password changes are not available in this runtime.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    try {
      await osirisRuntime.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      appToast.success('Password updated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password could not be updated.';
      setPasswordError(message);
      appToast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SettingsSection title="Account">
      <form data-testid="profile-form" onSubmit={handleProfileSubmit}>
        <SettingsRow
          label="Full name"
          description="Shown in comments, audit trails, and approvals."
        >
          <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
            <Input
              name="fullName"
              aria-label="Full name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={isSavingProfile}
            />
            <Button type="submit" size="sm" variant="cta" disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </SettingsRow>
        {profileError ? (
          <p role="alert" className="pb-3 text-xs text-destructive">
            {profileError}
          </p>
        ) : null}
      </form>
      <SettingsRow label="Email">
        <span className="text-sm text-foreground">{userEmail}</span>
      </SettingsRow>
      <SettingsRow label="Role">
        <span className="text-sm text-foreground">{roleLabel}</span>
      </SettingsRow>
      <SettingsRow label="Team">
        <span className="text-sm text-foreground">{teamLabel}</span>
      </SettingsRow>
      <SettingsRow label="Organisation">
        <span className="text-sm text-foreground">{organizationName}</span>
      </SettingsRow>
      <form
        data-testid="password-form"
        className="border-t border-border/50 pt-3"
        onSubmit={handlePasswordSubmit}
      >
        <div className="mb-3">
          <p className="text-sm font-medium text-foreground">
            {t('common.password', undefined, 'Password')}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t(
              'common.passwordChangeDescription',
              undefined,
              'Change your password after confirming the current one.',
            )}
          </p>
        </div>
        <div className="grid max-w-2xl gap-3 md:grid-cols-3">
          <Input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            aria-label="Current password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={isChangingPassword}
          />
          <Input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            aria-label="New password"
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={isChangingPassword}
          />
          <Input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-label="Confirm password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={isChangingPassword}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" variant="outline" disabled={isChangingPassword}>
            {isChangingPassword ? 'Updating...' : 'Update password'}
          </Button>
          {passwordError ? (
            <p role="alert" className="text-xs text-destructive">
              {passwordError}
            </p>
          ) : null}
        </div>
      </form>
    </SettingsSection>
  );
}
