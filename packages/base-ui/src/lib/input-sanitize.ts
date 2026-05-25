/** Remove whitespace — invalid in email local parts and URLs. */
export function sanitizeEmailInput(value: string): string {
  return value.replace(/\s/g, '');
}

/** Remove whitespace from URL input. */
export function sanitizeUrlInput(value: string): string {
  return value.replace(/\s/g, '');
}

/** Digits and optional leading minus for integer fields. */
export function sanitizeIntegerInput(value: string): string {
  const stripped = value.replace(/[^\d-]/g, '');
  if (!stripped.includes('-')) return stripped;

  const negative = stripped.startsWith('-');
  const digits = stripped.replace(/-/g, '');
  return negative ? `-${digits}` : digits;
}

/** Digits, one decimal separator, optional leading minus. */
export function sanitizeDecimalInput(value: string): string {
  let sanitized = value.replace(/[^\d.,-]/g, '');
  sanitized = sanitized.replace(/,/g, '.');

  const negative = sanitized.startsWith('-');
  sanitized = sanitized.replace(/-/g, '');

  const dotIndex = sanitized.indexOf('.');
  if (dotIndex !== -1) {
    sanitized = sanitized.slice(0, dotIndex + 1) + sanitized.slice(dotIndex + 1).replace(/\./g, '');
  }

  return negative ? `-${sanitized}` : sanitized;
}
