// apps/web/src/runtime/osiris/osirisClientUtils.ts
export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function readRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

export function readStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const text = await response.text();
  if (!text) return fallback;
  try {
    const payload: unknown = JSON.parse(text);
    if (isRecord(payload) && typeof payload.message === 'string') return payload.message;
    if (isRecord(payload) && typeof payload.error === 'string') return payload.error;
    if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === 'string') {
      return payload.error.message;
    }
  } catch {
    return fallback;
  }
  return fallback;
}
