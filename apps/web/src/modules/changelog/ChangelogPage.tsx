import { EmptyState } from '@/components/common/EmptyState';
import { ModulePage } from '@/components/common/PageLayout';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { changelogPageIcon } from '@/lib/modulePageIcons';

import { ChangelogTimeline } from './ChangelogTimeline';
import { useChangelog } from './data/useChangelog';

export function ChangelogPage() {
  const { ready } = usePreloadNamespaces(['changelog']);
  const { t } = useTranslation();
  const { data, isLoading, isError } = useChangelog();

  if (!ready) return null;

  const releases = data?.releases ?? [];

  return (
    <ModulePage
      title={t('changelog.title')}
      subtitle={t('changelog.subtitle')}
      icon={changelogPageIcon()}
    >
      {isLoading ? (
        <EmptyState title={t('changelog.loading')} compact />
      ) : isError ? (
        <EmptyState title={t('changelog.errorTitle')} description={t('changelog.errorBody')} />
      ) : releases.length === 0 ? (
        <EmptyState title={t('changelog.emptyTitle')} description={t('changelog.emptyBody')} />
      ) : (
        <section aria-label={t('changelog.releasesListLabel')}>
          <ChangelogTimeline releases={releases} />
        </section>
      )}
    </ModulePage>
  );
}
