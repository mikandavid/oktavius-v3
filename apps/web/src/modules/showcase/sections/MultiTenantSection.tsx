import { Button } from '@oktavius/base-ui';

import { useDemoData, type ClientRecord } from '@/app/demo-data';
import { CrudTable, type CrudColumn } from '@/components/data/CrudTable';
import { ActiveLocationPicker } from '@/components/layout/ActiveLocationPicker';

import { ShowcaseBlock } from '../shared';

const clientColumns: CrudColumn<ClientRecord>[] = [
  { key: 'name', header: 'Client' },
  { key: 'city', header: 'City' },
  { key: 'accountManager', header: 'Owner' },
];

export function MultiTenantSection() {
  const { activeOrgId, clients, organizations, setActiveOrgId } = useDemoData();
  const activeOrg = organizations.find((org) => org.id === activeOrgId);

  return (
    <div className="space-y-4">
      <ShowcaseBlock
        title="Org and location scoped list"
        meta={activeOrg ? activeOrg.name : 'No active organization'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {organizations.slice(0, 3).map((org) => (
              <Button
                key={org.id}
                size="sm"
                variant={org.id === activeOrgId ? 'default' : 'outline'}
                onClick={() => setActiveOrgId(org.id)}
              >
                {org.name}
              </Button>
            ))}
            <ActiveLocationPicker className="w-48" />
          </div>
        }
      >
        <CrudTable
          data={clients}
          columns={clientColumns}
          emptyTitle="No clients in this scope"
          emptyDescription="Switch organization or location to inspect another tenant scope."
          columnStateStorageKey="showcase-multi-tenant-clients"
        />
      </ShowcaseBlock>
    </div>
  );
}
