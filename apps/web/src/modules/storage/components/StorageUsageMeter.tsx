import { cn } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';

import { formatBytes } from '../data/fileTypes';
import { useStorageUsage } from '../data/useStorageData';

export function StorageUsageMeter() {
  const { t } = useTranslation();
  const usageQuery = useStorageUsage();
  const usage = usageQuery.data;
  if (!usage) return null;

  const percent = Math.min(100, Math.round(usage.usagePercent));
  const warning = percent >= 90;

  return (
    <div className="px-2.5 pt-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full', warning ? 'bg-destructive' : 'bg-cta')}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {t('storage.usage', {
          used: formatBytes(usage.usedBytes),
          limit: formatBytes(usage.limitBytes),
        })}
      </p>
    </div>
  );
}
