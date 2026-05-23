import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { Badge, ListRow, SectionCard, StatCard } from '@oktavius/base-ui';

import { useDemoData } from '@/app/demo-data';
import { DetailView } from '@/components/common/DetailView';
import { ModulePage } from '@/components/common/PageLayout';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { formatDisplayDate } from '@/lib/formatDate';
import { UsersIcon } from '@/lib/icons';

import { ORG_STATUS_MAP, organizationPageIcon } from './shared';

export function OrgDetailPage() {
  const { orgId } = useParams();
  const { organizations, getOrgMembers } = useDemoData();

  const org = organizations.find((entry) => entry.id === orgId);
  const members = useMemo(() => (org ? getOrgMembers(org.id) : []), [org, getOrgMembers]);

  if (!org) {
    return <Navigate to="/superadmin" replace />;
  }

  return (
    <ModulePage
      title={org.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{org.slug}</span>
          <StatusBadge status={org.status} variantMap={ORG_STATUS_MAP} />
          <Badge variant="outline">{org.environment}</Badge>
        </span>
      }
      icon={organizationPageIcon()}
      backTo="/superadmin"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Members" value={String(org.memberCount)} icon={<UsersIcon size={16} />} />
        <StatCard label="Plan" value={org.plan} />
        <StatCard label="Region" value={org.region} />
      </div>

      <DetailView
        title="Organization"
        subtitle="Tenant configuration and billing contact."
        fields={[
          {
            key: 'id',
            label: 'Organization ID',
            value: <span className="font-mono text-xs">{org.id}</span>,
            section: 'Identity',
          },
          { key: 'owner', label: 'Primary owner', value: org.ownerName, section: 'Identity' },
          { key: 'billing', label: 'Billing email', value: org.billingEmail, section: 'Billing' },
          { key: 'plan', label: 'Plan', value: org.plan, section: 'Billing' },
          {
            key: 'created',
            label: 'Created',
            value: formatDisplayDate(org.createdAt),
            section: 'Billing',
          },
        ]}
      />

      <SectionCard
        title="Members"
        meta="Users with access to this organization"
        actions={
          <Link to="/users/new" className="text-xs font-medium text-cta hover:underline">
            Invite user
          </Link>
        }
      >
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members assigned.</p>
        ) : (
          <div className="divide-y divide-border/50">
            {members.map((membership) => (
              <ListRow
                key={membership.id}
                title={membership.user.name}
                subtitle={membership.user.email}
                trailing={
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{membership.role}</Badge>
                    <Link
                      to={`/users/${membership.user.id}`}
                      className="text-xs font-medium text-cta hover:underline"
                    >
                      View
                    </Link>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </SectionCard>
    </ModulePage>
  );
}
