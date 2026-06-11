import { ApiAuthorizationError, ApiValidationError } from '@/api/contracts';

export type UserFacingApiErrorMessages = {
  aborted: string;
  network: string;
  fallback: string;
};

const DEFAULT_MESSAGES: UserFacingApiErrorMessages = {
  aborted: 'Request was cancelled.',
  network: 'Network error. Please check your connection.',
  fallback: 'Request failed.',
};

export function isNetworkRequestError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'TypeError' || error.name === 'NetworkError') return true;

  const message = error.message.toLowerCase();
  return (
    message.includes('networkerror') ||
    message.includes('failed to fetch') ||
    message.includes('load failed') ||
    message.includes('network request failed')
  );
}

export function formatUserFacingApiError(
  error: unknown,
  messages: Partial<UserFacingApiErrorMessages> = {},
): string {
  const resolvedMessages = { ...DEFAULT_MESSAGES, ...messages };

  if (error instanceof ApiValidationError || error instanceof ApiAuthorizationError) {
    return error.message || resolvedMessages.fallback;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return resolvedMessages.aborted;
  }

  if (isNetworkRequestError(error)) {
    return resolvedMessages.network;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  return resolvedMessages.fallback;
}
