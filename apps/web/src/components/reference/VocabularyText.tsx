import type { VocabularyKey } from '@oktavius/reference-data';

import { useVocabularyLabel } from '@/lib/reference-data';

type VocabularyTextProps = {
  vocabulary: VocabularyKey;
  code: string | null | undefined;
  fallback?: string;
};

export function VocabularyText({ vocabulary, code, fallback = '—' }: VocabularyTextProps) {
  const label = useVocabularyLabel(vocabulary, code);
  if (!code || !label) return <span className="text-muted-foreground">{fallback}</span>;
  return <>{label}</>;
}
