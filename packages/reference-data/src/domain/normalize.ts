import type { AppLocale } from './types';

export function normalizeLookupValue(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[./_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

export function buildAliasMap<TCode extends string>(
  definitions: readonly { code: TCode; aliases: readonly string[] }[],
): ReadonlyMap<string, TCode> {
  const entries = definitions.flatMap(({ code, aliases }) =>
    aliases
      .map((alias) => normalizeLookupValue(alias))
      .filter(Boolean)
      .map((alias) => [alias, code] as const),
  );
  return new Map(entries);
}

export function normalizeFromAliasMap<TCode extends string>(
  value: string | null | undefined,
  aliasMap: ReadonlyMap<string, TCode>,
  validCodes: readonly TCode[],
): TCode | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const direct = trimmed as TCode;
  if (validCodes.includes(direct)) return direct;

  const normalized = normalizeLookupValue(trimmed);
  const aliasMatch = aliasMap.get(normalized);
  if (aliasMatch) return aliasMatch;

  const snakeCase = normalized.replace(/\s+/g, '_') as TCode;
  if (validCodes.includes(snakeCase)) return snakeCase;

  return undefined;
}

export function resolveLocalizedLabel(
  labels: Record<string, Record<AppLocale, string>>,
  code: string,
  locale: AppLocale | string,
): string {
  const entry = labels[code];
  if (!entry) return code;
  if (locale in entry) return entry[locale as AppLocale];
  return entry.en;
}

export function resolveAppLocale(locale: string): AppLocale {
  if (locale === 'de' || locale === 'en' || locale === 'fr') return locale;
  if (locale.startsWith('de')) return 'de';
  if (locale.startsWith('fr')) return 'fr';
  return 'en';
}
