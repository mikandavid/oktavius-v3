import { describe, expect, it } from 'vitest';

import { ApiAuthorizationError, ApiValidationError } from '@/api/contracts';

import { formatUserFacingApiError, isNetworkRequestError } from './userFacingApiError';

describe('formatUserFacingApiError', () => {
  it('uses validation and authorization messages from API contract errors', () => {
    expect(formatUserFacingApiError(new ApiValidationError('Please check the form.', {}))).toBe(
      'Please check the form.',
    );
    expect(
      formatUserFacingApiError(new ApiAuthorizationError('You cannot do that.', 'admin')),
    ).toBe('You cannot do that.');
  });

  it('normalizes abort, network, and unknown errors', () => {
    expect(formatUserFacingApiError(new DOMException('Aborted', 'AbortError'))).toBe(
      'Request was cancelled.',
    );
    expect(formatUserFacingApiError(new TypeError('Failed to fetch'))).toBe(
      'Network error. Please check your connection.',
    );
    expect(formatUserFacingApiError({})).toBe('Request failed.');
  });

  it('detects common browser network request failures', () => {
    expect(isNetworkRequestError(new TypeError('Load failed'))).toBe(true);
    expect(isNetworkRequestError(new Error('Network request failed'))).toBe(true);
    expect(isNetworkRequestError(new Error('Business rule failed'))).toBe(false);
  });
});
