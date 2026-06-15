import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { ApiAuthorizationError, ApiRequestError, ApiValidationError } from './contracts';

const MAX_RETRIES = 1;
const MAX_RETRY_DELAY_MS = 30_000;

/**
 * Retry only transient failures. Terminal client errors (validation, auth, and
 * other 4xx) will fail identically on retry, so retrying them just delays the
 * error and adds load. 429 (rate limit) and 5xx/network errors are transient.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiValidationError || error instanceof ApiAuthorizationError) {
    return false;
  }
  if (error instanceof ApiRequestError) {
    const { statusCode } = error;
    if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
      return false;
    }
  }
  return failureCount < MAX_RETRIES;
}

/**
 * Exponential backoff with a cap and jitter, so a transient 429/5xx burst does
 * not amplify into a synchronized retry storm across every in-flight query.
 */
export function queryRetryDelay(attempt: number): number {
  return Math.min(MAX_RETRY_DELAY_MS, 500 * 2 ** attempt) + Math.floor(Math.random() * 250);
}

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        console.error('[react-query] Query failed', {
          queryKey: query.queryKey,
          meta: query.meta,
          error,
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        console.error('[react-query] Mutation failed', {
          mutationKey: mutation.options.mutationKey,
          meta: mutation.meta,
          error,
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 10,
        retry: shouldRetryQuery,
        retryDelay: queryRetryDelay,
        refetchOnWindowFocus: false,
        // Avoids a synchronized refetch of every stale query when the browser
        // reports back online; queries needing reconnect freshness opt in.
        refetchOnReconnect: false,
      },
    },
  });
}
