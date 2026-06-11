import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Button, Input, Label } from '@oktavius/base-ui';

import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { EyeIcon, EyeOffIcon, WarningIcon } from '@/lib/icons';
import type { OsirisAuthProviderName } from '@/runtime/osiris/authClient';
import { useOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { AuthShell } from './AuthShell';

function resolveRedirectTarget(rawRedirect: string | null) {
  if (!rawRedirect) return '/dashboard';
  if (!rawRedirect.startsWith('/') || rawRedirect.startsWith('//')) return '/dashboard';
  return rawRedirect;
}

export function LoginPage() {
  const runtime = useOsirisRuntime();
  const { ready } = usePreloadNamespaces(['auth']);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = useMemo(
    () => resolveRedirectTarget(searchParams.get('redirect')),
    [searchParams],
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OsirisAuthProviderName | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (runtime.sessionStatus === 'authenticated') {
      navigate(redirectTarget, { replace: true });
    }
  }, [navigate, redirectTarget, runtime.sessionStatus]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError(t('auth.emailPasswordRequired'));
      return;
    }

    if (!runtime.signIn) {
      setError(t('auth.signInUnavailable'));
      return;
    }

    setIsSubmitting(true);
    try {
      await runtime.signIn(normalizedEmail, password);
      navigate(redirectTarget, { replace: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t('errors.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProviderSignIn = async (provider: OsirisAuthProviderName) => {
    setError(null);

    if (!runtime.signInWithProvider) {
      setError(t('auth.signInUnavailable'));
      return;
    }

    setOauthLoading(provider);
    try {
      await runtime.signInWithProvider(provider, redirectTarget);
    } catch {
      setError(
        t('auth.socialLoginError', {
          provider: provider === 'google' ? 'Google' : 'Microsoft',
        }),
      );
      setOauthLoading(null);
    }
  };

  if (!ready) return null;

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginDescription')}>
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
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t('common.emailPlaceholder')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={isPasswordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('common.passwordPlaceholder')}
              className="pr-10"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isSubmitting}
              aria-label={isPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')}
              aria-pressed={isPasswordVisible}
              onMouseDown={(event) => {
                event.preventDefault();
                setIsPasswordVisible(true);
              }}
              onMouseUp={() => setIsPasswordVisible(false)}
              onMouseLeave={() => setIsPasswordVisible(false)}
              onTouchStart={(event) => {
                event.preventDefault();
                setIsPasswordVisible(true);
              }}
              onTouchEnd={() => setIsPasswordVisible(false)}
              onTouchCancel={() => setIsPasswordVisible(false)}
              onKeyDown={(event) => {
                if (event.key === ' ' || event.key === 'Enter') {
                  event.preventDefault();
                  setIsPasswordVisible(true);
                }
              }}
              onKeyUp={(event) => {
                if (event.key === ' ' || event.key === 'Enter') {
                  setIsPasswordVisible(false);
                }
              }}
              onBlur={() => setIsPasswordVisible(false)}
            >
              {isPasswordVisible ? (
                <EyeIcon size={16} aria-hidden="true" />
              ) : (
                <EyeOffIcon size={16} aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('auth.signingIn') : t('auth.login')}
        </Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          loading={oauthLoading === 'google'}
          disabled={oauthLoading !== null}
          onClick={() => void handleProviderSignIn('google')}
        >
          <GoogleMark />
          {t('auth.continueWithGoogle')}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          loading={oauthLoading === 'azure'}
          disabled={oauthLoading !== null}
          onClick={() => void handleProviderSignIn('azure')}
        >
          <MicrosoftMark />
          {t('auth.continueWithMicrosoft')}
        </Button>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t('auth.inviteOnlyLoginHint')}
      </p>
    </AuthShell>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}
