export type FormatMoneyOptions = {
  currency?: string;
  locale?: string;
  fractionDigits?: number;
  emptyFallback?: string;
  style?: 'currency' | 'decimal';
  signDisplay?: Intl.NumberFormatOptions['signDisplay'];
};

const DEFAULT_LOCALE = 'de-DE';
const DEFAULT_CURRENCY = 'EUR';

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter({
  locale,
  currency,
  fractionDigits,
  style,
  signDisplay,
}: Required<Pick<FormatMoneyOptions, 'currency' | 'locale' | 'fractionDigits' | 'style'>> &
  Pick<FormatMoneyOptions, 'signDisplay'>) {
  const cacheKey = `${locale}|${currency}|${fractionDigits}|${style}|${signDisplay ?? 'auto'}`;
  const cached = formatterCache.get(cacheKey);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat(locale, {
    style,
    currency: style === 'currency' ? currency : undefined,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    signDisplay,
  });
  formatterCache.set(cacheKey, formatter);
  return formatter;
}

export function formatMoney(
  amount: number | null | undefined,
  options: FormatMoneyOptions = {},
): string {
  const {
    currency = DEFAULT_CURRENCY,
    locale = DEFAULT_LOCALE,
    fractionDigits = 2,
    emptyFallback = '—',
    style = 'currency',
    signDisplay,
  } = options;

  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return emptyFallback;
  }

  return getFormatter({ locale, currency, fractionDigits, style, signDisplay }).format(amount);
}
