import { Badge } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';

import type { ChangeType } from './data/types';

const BADGE_VARIANT: Record<ChangeType, 'success' | 'info' | 'secondary'> = {
  added: 'success',
  improved: 'info',
  fixed: 'secondary',
};

export function ChangeBadge({ type }: { type: ChangeType }) {
  const { t } = useTranslation();
  return <Badge variant={BADGE_VARIANT[type]}>{t(`changelog.type.${type}`)}</Badge>;
}
