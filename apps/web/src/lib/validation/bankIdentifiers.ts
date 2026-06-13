/**
 * Lightweight client-side validation for bank identifiers shown on invoices.
 * These are advisory: the backend remains the authority. They exist so the
 * settings UI can flag an obviously malformed IBAN/BIC inline while the field
 * autosaves, rather than silently persisting garbage.
 */

const IBAN_SHAPE = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
const BIC_SHAPE = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

/** Strip spaces and uppercase — the canonical form for validation. */
export function normalizeBankIdentifier(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

/** ISO 13616 IBAN check, including the mod-97 checksum. */
export function isValidIban(raw: string): boolean {
  const value = normalizeBankIdentifier(raw);
  if (value.length < 15 || value.length > 34) return false;
  if (!IBAN_SHAPE.test(value)) return false;

  // Move the 4-char country/check prefix to the end, then map A→10 … Z→35.
  const rearranged = value.slice(4) + value.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const mapped = char >= 'A' && char <= 'Z' ? (char.charCodeAt(0) - 55).toString() : char;
    for (const digit of mapped) {
      remainder = (remainder * 10 + (digit.charCodeAt(0) - 48)) % 97;
    }
  }
  return remainder === 1;
}

/** ISO 9362 BIC shape (8 or 11 chars). No registry lookup. */
export function isValidBic(raw: string): boolean {
  return BIC_SHAPE.test(normalizeBankIdentifier(raw));
}
