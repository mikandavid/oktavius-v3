const orgScope = (orgId: string | null) => orgId ?? 'none';

export const whatsappKeys = {
  status: (orgId: string | null) => ['whatsapp', orgScope(orgId), 'status'] as const,
  config: (orgId: string | null) => ['whatsapp', orgScope(orgId), 'config'] as const,
  contacts: (orgId: string | null) => ['whatsapp', orgScope(orgId), 'contacts'] as const,
  members: (orgId: string | null) => ['whatsapp', orgScope(orgId), 'members'] as const,
};
