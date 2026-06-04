import { useMemo, useState } from 'react';

import { Badge, Combobox, type ComboboxOption, cn } from '@oktavius/base-ui';

type RecipientComboboxProps = {
  value: string[];
  options: ComboboxOption[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function RecipientCombobox({
  value,
  options,
  onChange,
  placeholder = 'Add recipient',
  className,
}: RecipientComboboxProps) {
  const [draft, setDraft] = useState<string | undefined>();

  const availableOptions = useMemo(
    () => options.filter((option) => !value.includes(option.value)),
    [options, value],
  );

  const addRecipient = (next: string | undefined) => {
    if (!next || value.includes(next)) return;
    onChange([...value, next]);
    setDraft(undefined);
  };

  const removeRecipient = (recipient: string) => {
    onChange(value.filter((entry) => entry !== recipient));
  };

  return (
    <div className={cn('space-y-2', className)}>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((recipient) => (
            <button key={recipient} type="button" onClick={() => removeRecipient(recipient)}>
              <Badge variant="secondary">{recipient} ×</Badge>
            </button>
          ))}
        </div>
      ) : null}
      <Combobox
        value={draft}
        options={availableOptions}
        placeholder={placeholder}
        onChange={(next) => {
          setDraft(next ?? undefined);
          addRecipient(next ?? undefined);
        }}
      />
    </div>
  );
}
