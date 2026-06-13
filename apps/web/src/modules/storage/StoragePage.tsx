import { ModulePage } from '@/components/common/PageLayout';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { storagePageIcon } from '@/lib/modulePageIcons';

export function StoragePage() {
  const { ready } = usePreloadNamespaces(['storage']);
  const { t } = useTranslation();

  if (!ready) return null;

  return (
    <ModulePage
      title={t('storage.pageTitle', undefined, 'Storage')}
      subtitle={t('storage.subtitle', undefined, 'Files and folders')}
      icon={storagePageIcon()}
    >
      <div className="text-sm text-muted-foreground">Storage module — coming together.</div>
    </ModulePage>
  );
}
