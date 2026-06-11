type CaptureContext = {
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
};

export function captureException(error: unknown, context?: CaptureContext): void {
  if (import.meta.env.DEV) {
    console.warn('[sentry] captureException', error, context);
  }
}
