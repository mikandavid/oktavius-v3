import { type ExternalToast, toast as sonnerToast, type ToasterProps } from 'sonner';

import { formatUserFacingApiError } from './userFacingApiError';

type ToastOptions = ExternalToast;

function resolveMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong.';
}

/** Normalized toast API — import from `@/lib/toast` only. */
export const appToast = {
  success(message: string, options?: ToastOptions) {
    return sonnerToast.success(message, options);
  },
  error(message: string | Error | unknown, options?: ToastOptions) {
    return sonnerToast.error(resolveMessage(message), options);
  },
  info(message: string, options?: ToastOptions) {
    return sonnerToast.info(message, options);
  },
  warning(message: string, options?: ToastOptions) {
    return sonnerToast.warning(message, options);
  },
  fromApiError(error: unknown, fallback = 'Request failed.') {
    return sonnerToast.error(formatUserFacingApiError(error, { fallback }));
  },
  promise: sonnerToast.promise.bind(sonnerToast),
};

/** @deprecated Prefer `appToast` — kept for gradual migration. */
export const toast = sonnerToast;

/** Semantic styling for Sonner toasts — pass spread into `<Toaster />`. */
export const sonnerToasterProps = {
  toastOptions: {
    classNames: {
      toast:
        'group rounded-control border border-border bg-card text-foreground shadow-none backdrop-blur-none',
      title: 'text-foreground font-medium',
      description: 'text-muted-foreground',
      actionButton: 'bg-primary text-primary-foreground',
      cancelButton: 'bg-muted text-foreground',
      closeButton:
        'border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
      success: '!border-success/40 !bg-success/10 text-foreground [&_[data-icon]]:!text-success',
      error:
        '!border-destructive/40 !bg-destructive/10 text-foreground [&_[data-icon]]:!text-destructive',
      warning: '!border-warning/40 !bg-warning/10 text-foreground [&_[data-icon]]:!text-warning',
      info: '!border-info/40 !bg-info/10 text-foreground [&_[data-icon]]:!text-info',
    },
  },
} satisfies Pick<ToasterProps, 'toastOptions'>;
