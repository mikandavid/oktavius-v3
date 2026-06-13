// apps/web/src/modules/members/MembersPage.tsx
import { ModulePage } from '@/components/common/PageLayout';
import { membersPageIcon } from '@/lib/modulePageIcons';

export function MembersPage() {
  return (
    <ModulePage
      title="Members"
      subtitle="Manage who can access this workspace"
      icon={membersPageIcon()}
    >
      {null}
    </ModulePage>
  );
}
