export type OsirisApiEnvironment = {
  VITE_OKTAVIUS_API_BASE_URL?: string;
};

function isAbsoluteHttpUrl(input: string) {
  return /^https?:\/\//i.test(input);
}

export function joinOsirisApiBaseUrl(baseUrl: string | undefined, input: string) {
  if (isAbsoluteHttpUrl(input)) return input;
  const normalizedBaseUrl = baseUrl?.trim();
  if (!normalizedBaseUrl) return input;

  return `${normalizedBaseUrl.replace(/\/$/, '')}/${input.replace(/^\//, '')}`;
}

export function resolveOsirisApiBaseUrl(env: OsirisApiEnvironment = import.meta.env) {
  return env.VITE_OKTAVIUS_API_BASE_URL?.trim() || undefined;
}
