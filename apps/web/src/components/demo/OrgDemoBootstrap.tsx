import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useDemoData } from '@/app/demo-data';
import { isOsirisFuneralPath } from '@/lib/org-profiles/nav-paths';
import { ORG_APEX_ID, ORG_DEMO_ID, ORG_KUNZ_ID } from '@/lib/org-profiles/profiles';
import { getWindowStorage, safeStorageGet } from '@/lib/storage/safeStorage';

const DEMO_ORG_STORAGE_KEY = 'oktavius.demoActiveOrgId';

function inferOrgFromPath(pathname: string): string | null {
  if (isOsirisFuneralPath(pathname)) return ORG_KUNZ_ID;

  const segments = pathname.split('/').filter(Boolean);
  const recordId = segments[segments.length - 1] ?? '';

  if (
    recordId.startsWith('cli_kunz') ||
    recordId.startsWith('case_kunz') ||
    recordId.startsWith('prd_kunz') ||
    recordId.startsWith('ord_kunz') ||
    recordId.startsWith('prj_kunz')
  ) {
    return ORG_KUNZ_ID;
  }

  if (
    recordId.startsWith('cli_100') ||
    recordId.startsWith('case_6') ||
    recordId.startsWith('prd_4') ||
    recordId.startsWith('ord_2') ||
    recordId.startsWith('prj_5') ||
    recordId.startsWith('inv_3') ||
    recordId.startsWith('inc_')
  ) {
    return ORG_APEX_ID;
  }

  return null;
}

/**
 * Syncs demo org from URL query and path — without fighting record-level org switches.
 */
export function OrgDemoBootstrap() {
  const { pathname, search } = useLocation();
  const { setActiveOrgId } = useDemoData();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const orgParam = params.get('org');

    if (orgParam === 'bestattung-kunz') {
      setActiveOrgId(ORG_KUNZ_ID);
      return;
    }

    if (orgParam === 'oktavius-demo') {
      setActiveOrgId(ORG_DEMO_ID);
      return;
    }

    if (orgParam === 'apex') {
      setActiveOrgId(ORG_APEX_ID);
      return;
    }

    const inferred = inferOrgFromPath(pathname);
    if (inferred) {
      setActiveOrgId(inferred);
      return;
    }

    const stored = safeStorageGet(getWindowStorage('sessionStorage'), DEMO_ORG_STORAGE_KEY);
    if (stored === ORG_KUNZ_ID || stored === ORG_APEX_ID || stored === ORG_DEMO_ID) {
      setActiveOrgId(stored);
    }
  }, [pathname, search, setActiveOrgId]);

  return null;
}
