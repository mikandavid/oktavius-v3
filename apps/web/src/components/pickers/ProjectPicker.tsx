import { useOptionalApiRegistry } from '@/api/ApiProvider';
import { EntityPicker, type EntityPickerValue } from '@/components/pickers/EntityPicker';

export type ProjectPickerValue = EntityPickerValue;

type ProjectPickerProps = {
  value: ProjectPickerValue | null;
  onChange: (value: ProjectPickerValue | null) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
};

function stringField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

/** Search projects from the configured API registry. */
export function ProjectPicker({
  value,
  onChange,
  disabled = false,
  id,
  placeholder = 'Search projects…',
}: ProjectPickerProps) {
  const api = useOptionalApiRegistry();

  const searchEntities = async (query: string): Promise<ProjectPickerValue[]> => {
    if (!api) return [];

    const projects = await api.projects.list({ pageSize: '8', search: query });

    return projects.data
      .map((project) => ({
        id: stringField(project, 'id'),
        label: stringField(project, 'name'),
        description: [stringField(project, 'status'), stringField(project, 'manager')]
          .filter(Boolean)
          .join(' · '),
      }))
      .filter((item) => item.id && item.label);
  };

  return (
    <EntityPicker
      id={id}
      value={value}
      onChange={onChange}
      searchEntities={searchEntities}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
