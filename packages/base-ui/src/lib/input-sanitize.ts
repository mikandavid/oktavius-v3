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
  const negative = value.trim().startsWith('-');
  let sanitized = value.replace(/[^\d.,]/g, '');

  const lastDot = sanitized.lastIndexOf('.');
  const lastComma = sanitized.lastIndexOf(',');
  const decimalSeparator =
    lastDot !== -1 && lastComma !== -1 ? (lastDot > lastComma ? '.' : ',') : null;

  if (decimalSeparator) {
    const decimalIndex = sanitized.lastIndexOf(decimalSeparator);
    const whole = sanitized.slice(0, decimalIndex).replace(/[.,]/g, '');
    const fraction = sanitized.slice(decimalIndex + 1).replace(/[.,]/g, '');
    sanitized = `${whole}.${fraction}`;
  } else {
    sanitized = sanitized.replace(/,/g, '.');

    const dots = sanitized.match(/\./g)?.length ?? 0;
    if (dots > 1) {
      const groups = sanitized.split('.');
      const looksLikeThousands = groups.slice(1).every((group) => group.length === 3);
      sanitized = looksLikeThousands
        ? groups.join('')
        : `${groups.slice(0, -1).join('')}.${groups.at(-1) ?? ''}`;
    }
  }

  const dotIndex = sanitized.indexOf('.');
  if (dotIndex !== -1) {
    sanitized = sanitized.slice(0, dotIndex + 1) + sanitized.slice(dotIndex + 1).replace(/\./g, '');
  }

  return negative ? `-${sanitized}` : sanitized;
}
