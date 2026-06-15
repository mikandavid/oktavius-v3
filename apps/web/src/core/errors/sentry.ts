import * as Sentry from '@sentry/react';

type CaptureContext = {
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
};

/**
 * Reports an error to Sentry with optional structured context. When no DSN is
 * configured Sentry self-disables (see src/instrument.ts), so this is a safe
 * no-op in dev/unconfigured envs; we additionally surface it to the console
 * during development for immediate visibility.
 */
export function captureException(error: unknown, context?: CaptureContext): void {
  if (import.meta.env.DEV) {
    console.warn('[sentry] captureException', error, context);
  }

  Sentry.captureException(error, {
    extra: context?.extra,
    tags: context?.tags,
  });
}

/**
 * Associates (or clears) the current user with subsequent Sentry events. Only a
 * stable id is sent — never email/username — to honor sendDefaultPii: false.
 */
export function setSentryUser(userId: string | null): void {
  Sentry.setUser(userId ? { id: userId } : null);
}
