import { useMemo, useState } from 'react';

import {
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@oktavius/base-ui';

import { useDemoData } from '@/app/demo-data';
import { ModulePage } from '@/components/common/PageLayout';
import { PageHeaderActions } from '@/components/common/PageHeaderButtons';
import { OrganizationIcon, UsersIcon } from '@/lib/icons';

import { SuperadminOrgsPanel } from './SuperadminOrgsPanel';
import { SuperadminUsersPanel } from './SuperadminUsersPanel';
import { superadminHeaderAction, superadminPageIcon } from './shared';

export function SuperadminPage() {
  const { organizations, platformUsers } = useDemoData();
  const [tab, setTab] = useState('organizations');

  const stats = useMemo(() => {
    const activeOrgs = organizations.filter((org) => org.status === 'Active').length;
    const trialOrgs = organizations.filter((org) => org.status === 'Trial').length;
    const superadmins = platformUsers.filter((user) => user.isSuperadmin).length;
    return {
      totalOrgs: organizations.length,
      activeOrgs,
      trialOrgs,
      totalUsers: platformUsers.length,
      superadmins,
    };
  }, [organizations, platformUsers]);

  return (
    <ModulePage
      title="Superadmin"
      subtitle="Manage tenant organizations, memberships, and platform-wide access."
      icon={superadminPageIcon()}
      actions={
        <PageHeaderActions>
          {tab === 'organizations' ? superadminHeaderAction() : null}
        </PageHeaderActions>
      }
      layoutClassName="min-w-0 w-full max-w-full"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Organizations"
          value={String(stats.totalOrgs)}
          icon={<OrganizationIcon size={16} />}
        />
        <StatCard label="Active tenants" value={String(stats.activeOrgs)} />
        <StatCard label="Trial tenants" value={String(stats.trialOrgs)} />
        <StatCard
          label="Platform users"
          value={String(stats.totalUsers)}
          icon={<UsersIcon size={16} />}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="users">Platform users</TabsTrigger>
        </TabsList>
        <TabsContent value="organizations" className="mt-4">
          <SuperadminOrgsPanel />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Cross-tenant users. {stats.superadmins} platform superadmin
            {stats.superadmins === 1 ? '' : 's'}.
          </p>
          <SuperadminUsersPanel />
        </TabsContent>
      </Tabs>
    </ModulePage>
  );
}
