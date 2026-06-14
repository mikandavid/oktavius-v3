// Mail provider connection state for the Mail settings tab.
//
// There is no mail-provider backend wired into V3 yet, so this hook reports a
// static "disconnected" status. It is shaped to be swapped for a real
// osiris/Nylas query later (mirroring the WhatsApp react-query status shape)
// without changing consumers.

/** Hosted email providers Oktavius can sync (Nylas provider identifiers). */
export type MailProviderType = 'google' | 'microsoft' | 'ews';

export type MailConnectionState = 'connected' | 'disconnected';

export type MailAccount = {
  id: string;
  provider: MailProviderType;
  email: string;
};

export type MailProviderStatus = {
  status: MailConnectionState;
  accounts: MailAccount[];
};

export const SUPPORTED_MAIL_PROVIDERS: MailProviderType[] = ['google', 'microsoft', 'ews'];

export const DISCONNECTED_MAIL_STATUS: MailProviderStatus = {
  status: 'disconnected',
  accounts: [],
};

export function useMailProviderStatus(): MailProviderStatus {
  return DISCONNECTED_MAIL_STATUS;
}
