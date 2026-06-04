import { useMemo, useState } from 'react';

import { Button, Textarea, cn } from '@oktavius/base-ui';

type JsonFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  minRows?: number;
  className?: string;
};

export function JsonField({
  id,
  value,
  onChange,
  placeholder = '{ "key": "value" }',
  disabled = false,
  error,
  minRows = 8,
  className,
}: JsonFieldProps) {
  const [parseError, setParseError] = useState<string | null>(null);

  const resolvedError = error ?? parseError;

  const handleFormat = () => {
    if (!value.trim()) {
      setParseError(null);
      return;
    }
    try {
      const parsed = JSON.parse(value) as unknown;
      onChange(JSON.stringify(parsed, null, 2));
      setParseError(null);
    } catch {
      setParseError('Invalid JSON — fix syntax before formatting.');
    }
  };

  const syntaxState = useMemo(() => {
    if (!value.trim()) return 'empty' as const;
    try {
      JSON.parse(value);
      return 'valid' as const;
    } catch {
      return 'invalid' as const;
    }
  }, [value]);

  return (
    <div className={cn('space-y-2', className)}>
      <Textarea
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        spellCheck={false}
        className={cn(
          'min-h-[8rem] font-mono text-xs leading-relaxed',
          syntaxState === 'invalid' && !resolvedError ? 'ring-1 ring-destructive/40' : undefined,
        )}
        style={{ minHeight: `${minRows * 1.25}rem` }}
        onChange={(event) => {
          setParseError(null);
          onChange(event.target.value);
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {syntaxState === 'valid'
            ? 'Valid JSON'
            : syntaxState === 'invalid'
              ? 'Invalid JSON'
              : 'Optional JSON payload'}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={handleFormat}
        >
          Format JSON
        </Button>
      </div>
      {resolvedError ? (
        <p role="alert" className="text-xs text-destructive">
          {resolvedError}
        </p>
      ) : null}
    </div>
  );
}
