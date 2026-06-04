import { Combobox, type ComboboxOption } from '@oktavius/base-ui';

type RoleSelectorProps = {
  value: string | null;
  options: ComboboxOption[];
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
};

export function RoleSelector({
  value,
  options,
  onChange,
  placeholder = 'Select role',
  className,
}: RoleSelectorProps) {
  return (
    <Combobox
      className={className}
      value={value ?? undefined}
      options={options}
      placeholder={placeholder}
      onChange={(next) => onChange(next ?? null)}
    />
  );
}
