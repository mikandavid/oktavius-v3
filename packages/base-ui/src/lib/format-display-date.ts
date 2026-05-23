import { format, isValid, parseISO } from 'date-fns';

function toDate(value: string | Date): Date | null {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

/** User-facing date: DD.MM.YYYY */
export function formatDisplayDate(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const date = toDate(value);
  if (!date) return String(value);
  return format(date, 'dd.MM.yyyy');
}

/** User-facing date + time: DD.MM.YYYY HH:mm */
export function formatDisplayDateTime(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const date = toDate(value);
  if (!date) return String(value);
  return format(date, 'dd.MM.yyyy HH:mm');
}
