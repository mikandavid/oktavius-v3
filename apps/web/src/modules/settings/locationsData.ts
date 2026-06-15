import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { appToast } from '@/lib/toast';
import type {
  OsirisOrgLocation,
  OsirisOrgLocationInput,
} from '@/runtime/osiris/locationAdminClient';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

type OrgId = string | null;

// Scoped by org so switching workspace swaps to a separate cache entry instead
// of letting a slow fetch for the previous org overwrite the new one.
function orgLocationsKey(orgId: OrgId) {
  return ['org-locations', orgId] as const;
}

function required<T>(fn: T | undefined, name: string): T {
  if (!fn) throw new Error(`Osiris runtime does not support ${name} in this environment.`);
  return fn;
}

export function useOrgLocations() {
  const runtime = useOptionalOsirisRuntime();
  const orgId = runtime?.activeOrgId ?? null;
  return useQuery({
    queryKey: orgLocationsKey(orgId),
    queryFn: () => required(runtime?.listOrgLocations, 'listOrgLocations')(orgId),
    enabled: Boolean(orgId && runtime?.listOrgLocations),
  });
}

export function useOrgLocationMutations() {
  const runtime = useOptionalOsirisRuntime();
  const orgId = runtime?.activeOrgId ?? null;
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: orgLocationsKey(orgId) });
  };

  const saveLocation = useMutation({
    mutationFn: (vars: {
      id: string | null;
      input: OsirisOrgLocationInput;
    }): Promise<OsirisOrgLocation> =>
      vars.id
        ? required(runtime?.updateOrgLocation, 'updateOrgLocation')(orgId, vars.id, vars.input)
        : required(runtime?.createOrgLocation, 'createOrgLocation')(orgId, vars.input),
    onSuccess: (_data, vars) => {
      invalidate();
      appToast.success(vars.id ? 'Location saved.' : 'Location created.');
    },
    onError: (error) => appToast.fromApiError(error, 'Location could not be saved.'),
  });

  const deactivateLocation = useMutation({
    mutationFn: (locationId: string): Promise<OsirisOrgLocation> =>
      required(runtime?.updateOrgLocation, 'updateOrgLocation')(orgId, locationId, {
        isActive: false,
      }),
    onSuccess: () => {
      invalidate();
      appToast.success('Location deactivated.');
    },
    onError: (error) => appToast.fromApiError(error, 'Location could not be deactivated.'),
  });

  return { saveLocation, deactivateLocation };
}
