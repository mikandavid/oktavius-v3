import { describe, expect, it } from 'vitest';

import { ApiAuthorizationError, ApiRequestError, ApiValidationError } from './contracts';
import { queryRetryDelay, shouldRetryQuery } from './queryClient';

describe('shouldRetryQuery', () => {
  it('does not retry validation or authorization errors', () => {
    expect(shouldRetryQuery(0, new ApiValidationError('bad', {}))).toBe(false);
    expect(shouldRetryQuery(0, new ApiAuthorizationError('nope', 'org.manage'))).toBe(false);
  });

  it('does not retry terminal 4xx request errors', () => {
    expect(shouldRetryQuery(0, new ApiRequestError('not found', 404))).toBe(false);
    expect(shouldRetryQuery(0, new ApiRequestError('conflict', 409))).toBe(false);
  });

  it('retries 429 rate-limit errors', () => {
    expect(shouldRetryQuery(0, new ApiRequestError('slow down', 429))).toBe(true);
  });

  it('retries 5xx request errors', () => {
    expect(shouldRetryQuery(0, new ApiRequestError('boom', 500))).toBe(true);
    expect(shouldRetryQuery(0, new ApiRequestError('gateway', 503))).toBe(true);
  });

  it('retries unknown/network errors', () => {
    expect(shouldRetryQuery(0, new Error('network down'))).toBe(true);
  });

  it('stops retrying after the cap', () => {
    expect(shouldRetryQuery(1, new ApiRequestError('boom', 500))).toBe(false);
    expect(shouldRetryQuery(1, new Error('network down'))).toBe(false);
  });
});

describe('queryRetryDelay', () => {
  it('grows exponentially and stays within the cap + jitter', () => {
    expect(queryRetryDelay(0)).toBeGreaterThanOrEqual(500);
    expect(queryRetryDelay(0)).toBeLessThan(500 + 250);

    expect(queryRetryDelay(1)).toBeGreaterThanOrEqual(1000);
    expect(queryRetryDelay(1)).toBeLessThan(1000 + 250);

    // Capped at 30s (+ up to 250ms jitter) no matter how high the attempt.
    expect(queryRetryDelay(20)).toBeLessThanOrEqual(30_000 + 250);
  });
});
