import { useEffect } from 'react';

import { useDemoData } from '@/app/demo-data';
import type { OrgScoped } from '@/app/demo-data/records';
import { ORG_APEX_ID } from '@/lib/org-profiles/profiles';

/** When opening a deep link, switch active org to match the record's tenant. */
export function useEnsureDemoOrgForRecord(record: OrgScoped | null | undefined) {
  const { setActiveOrgId } = useDemoData();

  useEffect(() => {
    if (!record) return;
    setActiveOrgId(record.orgId ?? ORG_APEX_ID);
  }, [record, setActiveOrgId]);
}
