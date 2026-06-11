import type { CustomFieldDefinition } from './types';

const EMPTY_CUSTOM_FIELD_DEFINITIONS: CustomFieldDefinition[] = [];

export function useCustomFieldDefinitions(entityType: string): {
  definitions: CustomFieldDefinition[];
  isLoading: boolean;
} {
  void entityType;
  return { definitions: EMPTY_CUSTOM_FIELD_DEFINITIONS, isLoading: false };
}
