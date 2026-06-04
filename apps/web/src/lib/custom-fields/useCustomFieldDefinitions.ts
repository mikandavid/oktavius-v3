import { useMemo } from 'react';

import { getCustomFieldDefinitions } from './demoDefinitions';
import type { CustomFieldDefinition } from './types';

export function useCustomFieldDefinitions(entityType: string): {
  definitions: CustomFieldDefinition[];
  isLoading: boolean;
} {
  const definitions = useMemo(() => getCustomFieldDefinitions(entityType), [entityType]);
  return { definitions, isLoading: false };
}
