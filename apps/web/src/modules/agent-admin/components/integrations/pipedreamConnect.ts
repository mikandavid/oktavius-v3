import { createFrontendClient } from '@pipedream/sdk/browser';

interface PipedreamAttempt {
  connectToken: string;
  externalUserId: string;
  expiresAt: string;
  oauthAppId?: string;
  projectEnvironment?: 'development' | 'production';
}

interface LaunchOptions {
  attempt: PipedreamAttempt;
  appKey: string;
  /** Existing Pipedream account id — only set for reconnect flows. */
  accountId?: string;
  onSuccess: (accountId: string) => void;
  onError: (error: Error) => void;
}

/**
 * Open Pipedream's hosted OAuth window for a prepared connect attempt. Shared by the
 * create and reconnect flows; the caller finalizes the connection on success.
 */
export async function launchPipedreamConnect({
  attempt,
  appKey,
  accountId,
  onSuccess,
  onError,
}: LaunchOptions): Promise<void> {
  const client = createFrontendClient({
    externalUserId: attempt.externalUserId,
    projectEnvironment: attempt.projectEnvironment,
    token: attempt.connectToken,
    tokenCallback: async () => ({
      token: attempt.connectToken,
      expiresAt: new Date(attempt.expiresAt),
      connectLinkUrl: '',
    }),
  });
  await client.connectAccount({
    app: appKey,
    ...(accountId ? { accountId } : {}),
    oauthAppId: attempt.oauthAppId,
    token: attempt.connectToken,
    onSuccess: (result) => onSuccess(result.id),
    onError: (error) => onError(error instanceof Error ? error : new Error(String(error))),
  });
}
