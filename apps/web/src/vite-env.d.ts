/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OKTAVIUS_API_BASE_URL?: string;
  readonly VITE_OKTAVIUS_API_TOKEN?: string;
  /** Sentry DSN. When unset, Sentry self-disables (see src/instrument.ts). */
  readonly VITE_SENTRY_DSN?: string;
}
