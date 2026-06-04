import { EntityPicker, type EntityPickerValue } from '@/components/pickers/EntityPicker';
import { useDemoData } from '@/app/demo-data';

export type ProjectPickerValue = EntityPickerValue;

type ProjectPickerProps = {
  value: ProjectPickerValue | null;
  onChange: (value: ProjectPickerValue | null) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
};

/** Search projects from the active demo dataset. */
export function ProjectPicker({
  value,
  onChange,
  disabled = false,
  id,
  placeholder = 'Search projects…',
}: ProjectPickerProps) {
  const { projects } = useDemoData();

  const searchEntities = async (query: string): Promise<ProjectPickerValue[]> => {
    const normalized = query.trim().toLowerCase();
    const items = projects.map((project) => ({
      id: project.id,
      label: project.name,
      description: `${project.status} · ${project.manager}`,
    }));

    if (!normalized) return items.slice(0, 8);
    return items
      .filter(
        (item) =>
          item.label.toLowerCase().includes(normalized) ||
          item.description?.toLowerCase().includes(normalized),
      )
      .slice(0, 8);
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
