import { PageHeaderCtaButton } from '@/components/common/PageHeaderButtons';
import { ModulePage } from '@/components/common/PageLayout';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { UploadIcon } from '@/lib/icons';
import { storagePageIcon } from '@/lib/modulePageIcons';

import { StorageHeaderControls } from './components/StorageHeaderControls';
import { StorageMainPane } from './components/StorageMainPane';
import { StorageRail } from './components/StorageRail';
import { useStorageViewState } from './useStorageViewState';

export function StoragePage() {
  const { ready } = usePreloadNamespaces(['storage']);
  const { t } = useTranslation();
  const state = useStorageViewState();

  const headerActions = (
    <>
      <StorageHeaderControls state={state} />
      <PageHeaderCtaButton
        onClick={() => document.dispatchEvent(new CustomEvent('storage:upload'))}
      >
        <UploadIcon size={16} />
        {t('storage.actions.upload', undefined, 'Upload')}
      </PageHeaderCtaButton>
    </>
  );

  if (!ready) return null;

  return (
    <ModulePage
      title={t('storage.pageTitle', undefined, 'Storage')}
      subtitle={t('storage.subtitle', undefined, 'Files and folders')}
      icon={storagePageIcon()}
      actions={headerActions}
      fillHeight
    >
      <div className="flex h-full min-h-0 gap-4">
        <StorageRail
          state={state}
          className="hidden w-60 shrink-0 lg:flex"
          onNewFolder={() => document.dispatchEvent(new CustomEvent('storage:newFolder'))}
        />
        <StorageMainPane state={state} className="min-w-0 flex-1" />
      </div>
    </ModulePage>
  );
}
