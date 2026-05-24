import { getCurrencyDisplayName } from '@oktavius/reference-data';

import { useUserPreferences } from '@/lib/userPreferences';

type CurrencyTextProps = {
  code: string | null | undefined;
  fallback?: string;
};

export function CurrencyText({ code, fallback = '—' }: CurrencyTextProps) {
  const { locale } = useUserPreferences();
  if (!code) return <span className="text-muted-foreground">{fallback}</span>;
  const name = getCurrencyDisplayName(code, locale);
  return <>{`${code} — ${name}`}</>;
}
