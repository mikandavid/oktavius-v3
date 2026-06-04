export type CustomFieldOption = {
  value: string;
  label: string;
};

export type CustomFieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'currency'
  | 'date';

export type CustomFieldDefinition = {
  id: string;
  entityType: string;
  fieldKey: string;
  label: string;
  fieldType: CustomFieldType;
  options?: CustomFieldOption[];
  required?: boolean;
  placeholder?: string;
  description?: string;
  section?: string;
  sortOrder: number;
  defaultValue?: string | boolean | number | string[];
};

export type CustomFieldValues = Record<
  string,
  string | boolean | number | string[] | null | undefined
>;
