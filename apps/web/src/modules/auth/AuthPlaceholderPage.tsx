import { Button, buttonVariants, Input, Label } from '@oktavius/base-ui';
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { SpinnerIcon, WarningIcon } from '@/lib/icons';
import { useOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { AuthShell } from './AuthShell';

type AuthPlaceholderPageProps = {
  titleKey: string;
  subtitleKey: string;
};

export function AuthPlaceholderPage({ titleKey, subtitleKey }: AuthPlaceholderPageProps) {
  const navigate = useNavigate();
  const { ready } = usePreloadNamespaces(['auth']);
  const { t } = useTranslation();

  if (!ready) return null;

  return (
    <AuthShell title={t(titleKey)} subtitle={t(subtitleKey)}>
      <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/login')}>
        {t('auth.backToLogin')}
      </Button>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const runtime = useOsirisRuntime();
  const navigate = useNavigate();
  const { ready } = usePreloadNamespaces(['auth']);
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError(t('validation.required'));
      return;
    }

    if (!runtime.requestPasswordReset) {
      setError(t('auth.signInUnavailable'));
      return;
    }

    setIsSubmitting(true);
    try {
      await runtime.requestPasswordReset(normalizedEmail);
      setSubmitted(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t('errors.resetPasswordFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ready) return null;

  if (submitted) {
    return (
      <AuthShell title={t('auth.forgotPasswordTitle')} subtitle={t('auth.resetLinkSent')}>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate('/login')}
        >
          {t('auth.backToLogin')}
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('auth.forgotPasswordTitle')} subtitle={t('auth.forgotPasswordDescription')}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div
            className="flex gap-2 rounded-control border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            <WarningIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            {t('auth.email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="flex h-9 w-full rounded-control border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={t('common.emailPlaceholder')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('auth.sendResetLink')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate('/login')}
        >
          {t('auth.backToLogin')}
        </Button>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const runtime = useOsirisRuntime();
  const navigate = useNavigate();
  const { ready } = usePreloadNamespaces(['auth']);
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accessToken = useMemo(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return hashParams.get('access_token');
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!accessToken) {
      setError(t('auth.recoverySessionMissing'));
      return;
    }
    if (password.length < 8) {
      setError(t('errors.minPasswordLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('validation.passwordMismatch'));
      return;
    }
    if (!runtime.updateRecoveryPassword) {
      setError(t('auth.signInUnavailable'));
      return;
    }

    setIsSubmitting(true);
    try {
      await runtime.updateRecoveryPassword({ accessToken, password });
      await runtime.signOut?.();
      setSuccess(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t('errors.resetPasswordFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ready) return null;

  if (success) {
    return (
      <AuthShell title={t('auth.resetPasswordTitle')} subtitle={t('auth.passwordResetSuccess')}>
        <Button type="button" className="w-full" onClick={() => navigate('/login')}>
          {t('auth.backToLogin')}
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('auth.resetPasswordTitle')} subtitle={t('auth.resetPasswordDescription')}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div
            className="flex gap-2 rounded-control border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            <WarningIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            {t('auth.newPassword')}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="flex h-9 w-full rounded-control border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={t('common.passwordPlaceholder')}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="confirmPassword">
            {t('auth.confirmPassword')}
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="flex h-9 w-full rounded-control border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={t('common.passwordPlaceholder')}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('auth.resetPassword')}
        </Button>
      </form>
    </AuthShell>
  );
}

function isValidInviteToken(token: string | undefined): token is string {
  return typeof token === 'string' && token.length >= 32;
}

function normalizeInvitedEmail(value: string | null) {
  const email = value?.trim().toLowerCase();
  if (!email || !email.includes('@')) return null;
  return email;
}

function authLinkClasses(variant: 'default' | 'outline' = 'default') {
  return `${buttonVariants({ variant })} w-full`;
}

export function SignUpPage() {
  const runtime = useOsirisRuntime();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { ready } = usePreloadNamespaces(['auth']);
  const { t } = useTranslation();
  const invitedEmail = useMemo(
    () => normalizeInvitedEmail(searchParams.get('invitedEmail')),
    [searchParams],
  );
  const inviteToken = searchParams.get('inviteToken') ?? undefined;
  const canRegisterFromInvitation = Boolean(invitedEmail && isValidInviteToken(inviteToken));
  const loginHref = searchParams.get('redirect')
    ? `/login?redirect=${encodeURIComponent(resolveRedirectTarget(searchParams.get('redirect')))}`
    : '/login';
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!canRegisterFromInvitation || !inviteToken || !invitedEmail) {
      setError(t('auth.inviteOnlyDescription'));
      return;
    }
    if (password.length < 8) {
      setError(t('errors.minPasswordLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('validation.passwordMismatch'));
      return;
    }
    if (!runtime.registerInvitation || !runtime.signIn) {
      setError(t('auth.signInUnavailable'));
      return;
    }

    setIsSubmitting(true);
    try {
      await runtime.registerInvitation({
        token: inviteToken,
        password,
        fullName: fullName.trim() || undefined,
      });
      await runtime.signIn(invitedEmail, password);
      navigate(resolveRedirectTarget(searchParams.get('redirect')), { replace: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t('auth.invitationSignupFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ready) return null;

  if (!canRegisterFromInvitation) {
    return (
      <AuthShell title={t('auth.inviteOnlyTitle')} subtitle={t('auth.inviteOnlyDescription')}>
        <div className="space-y-4">
          <Link to={loginHref} className={authLinkClasses('outline')}>
            {t('auth.backToLogin')}
          </Link>
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.inviteOnlyLoginHint')}
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('auth.invitedSignUpTitle')} subtitle={t('auth.invitedSignUpDescription')}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div
            className="flex gap-2 rounded-control border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            <WarningIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="fullName">{t('auth.fullName')}</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder={t('auth.fullNamePlaceholder')}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={invitedEmail ?? ''}
            disabled
            readOnly
          />
          <p className="text-xs text-muted-foreground">{t('auth.invitedSignUpEmailLocked')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={t('common.passwordPlaceholder')}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t('common.passwordPlaceholder')}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('auth.signUp')}
        </Button>
      </form>
    </AuthShell>
  );
}

function resolveRedirectTarget(rawRedirect: string | null) {
  if (!rawRedirect) return '/dashboard';
  if (!rawRedirect.startsWith('/') || rawRedirect.startsWith('//')) return '/dashboard';
  return rawRedirect;
}

function parsePositiveInteger(value: string | null) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function AuthCallbackPage() {
  const runtime = useOsirisRuntime();
  const completeProviderSignIn = runtime.completeProviderSignIn;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { ready } = usePreloadNamespaces(['auth']);
  const { t } = useTranslation();
  const redirectTarget = useMemo(
    () => resolveRedirectTarget(searchParams.get('redirect')),
    [searchParams],
  );
  const callbackParams = useMemo(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const readSessionParam = (key: string) => hashParams.get(key) ?? searchParams.get(key);

    return {
      providerError:
        searchParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error'),
      accessToken: readSessionParam('access_token'),
      refreshToken: readSessionParam('refresh_token'),
      expiresIn: parsePositiveInteger(readSessionParam('expires_in')),
      expiresAt: parsePositiveInteger(readSessionParam('expires_at')),
    };
  }, [searchParams]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function completeSession() {
      if (callbackParams.providerError) {
        setError(callbackParams.providerError);
        return;
      }

      if (!callbackParams.accessToken) {
        setError(t('auth.oauthSessionMissing'));
        return;
      }

      if (!completeProviderSignIn) {
        setError(t('auth.signInUnavailable'));
        return;
      }

      try {
        await completeProviderSignIn({
          accessToken: callbackParams.accessToken,
          refreshToken: callbackParams.refreshToken,
          expiresIn: callbackParams.expiresIn,
          expiresAt: callbackParams.expiresAt,
        });
        if (!cancelled) {
          navigate(redirectTarget, { replace: true });
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : t('auth.oauthSessionFailed'));
        }
      }
    }

    void completeSession();

    return () => {
      cancelled = true;
    };
  }, [callbackParams, completeProviderSignIn, navigate, ready, redirectTarget, t]);

  if (!ready) return null;

  if (error) {
    return (
      <AuthShell title={t('auth.authCallbackPendingTitle')} subtitle={t('auth.oauthSessionFailed')}>
        <div
          className="mb-4 flex gap-2 rounded-control border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          <WarningIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate('/login')}
        >
          {t('auth.backToLogin')}
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t('auth.authCallbackPendingTitle')}
      subtitle={t('auth.authCallbackPendingDescription')}
    >
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <SpinnerIcon size={20} className="animate-spin" aria-hidden="true" />
      </div>
    </AuthShell>
  );
}

export function InvitePage() {
  const runtime = useOsirisRuntime();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { ready } = usePreloadNamespaces(['auth']);
  const { t } = useTranslation();
  const [resolution, setResolution] = useState<Awaited<
    ReturnType<NonNullable<typeof runtime.resolveInvitationToken>>
  > | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoAcceptAttemptedTokenRef = useRef<string | null>(null);
  const validToken = isValidInviteToken(token);

  useEffect(() => {
    if (!ready || !validToken) return;

    let isMounted = true;
    setIsResolving(true);
    setError(null);

    if (!runtime.resolveInvitationToken) {
      setError(t('auth.signInUnavailable'));
      setIsResolving(false);
      return;
    }

    void runtime
      .resolveInvitationToken(token)
      .then((nextResolution) => {
        if (!isMounted) return;
        setResolution(nextResolution);
      })
      .catch((nextError) => {
        if (!isMounted) return;
        setResolution(null);
        setError(
          nextError instanceof Error ? nextError.message : t('auth.invitationResolveFailed'),
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsResolving(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ready, runtime, t, token, validToken]);

  const handleAccept = useCallback(async () => {
    if (!validToken) return;
    if (!runtime.acceptInvitation) {
      setError(t('auth.signInUnavailable'));
      return;
    }

    setIsAccepting(true);
    setError(null);
    try {
      const accepted = await runtime.acceptInvitation(token);
      await runtime.setActiveOrgId?.(accepted.orgId);
      await runtime.reload();
      navigate('/dashboard', { replace: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t('auth.invitationAcceptFailed'));
    } finally {
      setIsAccepting(false);
    }
  }, [navigate, runtime, t, token, validToken]);

  const userEmail = runtime.currentUser.email?.trim().toLowerCase() ?? null;
  const invitedEmail = resolution?.email?.trim().toLowerCase() ?? null;
  const emailsMatch = invitedEmail !== null && userEmail !== null && invitedEmail === userEmail;
  const isAuthenticated = runtime.sessionStatus === 'authenticated';
  const shouldAutoAccept =
    isAuthenticated &&
    resolution !== null &&
    (resolution.status === 'already_accepted' ||
      resolution.kind === 'invite_link' ||
      (resolution.kind === 'email_invitation' && emailsMatch));

  useEffect(() => {
    if (!ready || !validToken || !shouldAutoAccept || isAccepting) return;
    if (autoAcceptAttemptedTokenRef.current === token) return;

    autoAcceptAttemptedTokenRef.current = token;
    void handleAccept();
  }, [handleAccept, isAccepting, ready, shouldAutoAccept, token, validToken]);

  if (!ready) return null;

  if (!validToken) {
    return (
      <AuthShell
        title={t('auth.invitationInvalidTitle')}
        subtitle={t('auth.invitationInvalidDescription')}
      >
        <Link to="/login" className={authLinkClasses('outline')}>
          {t('auth.backToLogin')}
        </Link>
      </AuthShell>
    );
  }

  if (runtime.isLoading || isResolving) {
    return (
      <AuthShell title={t('auth.invitePendingTitle')} subtitle={t('common.loading')}>
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <SpinnerIcon size={20} className="animate-spin" aria-hidden="true" />
        </div>
      </AuthShell>
    );
  }

  if (!resolution) {
    return (
      <AuthShell
        title={t('auth.invitationInvalidTitle')}
        subtitle={t('auth.invitationInvalidDescription')}
      >
        {error ? (
          <div
            className="mb-4 flex gap-2 rounded-control border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <WarningIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
        <Link to="/login" className={authLinkClasses('outline')}>
          {t('auth.backToLogin')}
        </Link>
      </AuthShell>
    );
  }

  if (!isAuthenticated) {
    const invitePath = `/invite/${token}`;
    const signUpParams = new URLSearchParams();
    const canRegisterFromInvitation =
      resolution.kind === 'email_invitation' &&
      resolution.status !== 'already_accepted' &&
      Boolean(resolution.email);

    if (canRegisterFromInvitation && resolution.email) {
      signUpParams.set('invitedEmail', resolution.email);
      signUpParams.set('inviteToken', token);
    }

    return (
      <AuthShell
        title={t('auth.invitationLoginTitle')}
        subtitle={t('auth.invitationLoginDescription')}
      >
        <div className="space-y-3">
          <Link
            to={`/login?redirect=${encodeURIComponent(invitePath)}`}
            className={authLinkClasses()}
          >
            {t('auth.login')}
          </Link>
          {canRegisterFromInvitation ? (
            <Link to={`/signup?${signUpParams.toString()}`} className={authLinkClasses('outline')}>
              {t('auth.signUp')}
            </Link>
          ) : null}
        </div>
      </AuthShell>
    );
  }

  if (isAccepting || shouldAutoAccept) {
    return (
      <AuthShell title={t('auth.invitationAcceptTitle')} subtitle={t('common.loading')}>
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <SpinnerIcon size={20} className="animate-spin" aria-hidden="true" />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t('auth.invitationAcceptTitle')}
      subtitle={t('auth.invitationAcceptDescription')}
    >
      {error ? (
        <div
          className="mb-4 flex gap-2 rounded-control border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          <WarningIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
      <p className="mb-4 text-center text-sm text-muted-foreground">
        {t('auth.invitationAcceptSignedInAs', { email: runtime.currentUser.email ?? '-' })}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Link to="/dashboard" className={authLinkClasses('outline')}>
          {t('common.cancel')}
        </Link>
        <Button type="button" className="w-full" onClick={() => void handleAccept()}>
          {t('auth.invitationAcceptCta')}
        </Button>
      </div>
    </AuthShell>
  );
}
