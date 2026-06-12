import { Badge, Button, cn, Label } from '@oktavius/base-ui';

import { TokenFormatControls, TokenPreviewSwatch } from '@/lib/design-tokens/TokenControlEditors';
import type { DesignToken } from '@/lib/design-tokens/tokenRegistry';

export function TokenEditor({
  token,
  value,
  defaultValue,
  onChange,
  onReset,
}: {
  token: DesignToken;
  value: string | undefined;
  defaultValue: string;
  onChange: (value: string) => void;
  onReset: () => void;
}) {
  const effective = value ?? defaultValue;
  const isOverridden = value !== undefined;
  const hasColorPreview = token.format === 'hsl' || token.format === 'oklch';

  return (
    <div className="space-y-2 rounded-md border border-border/50 p-3">
      <div className="flex items-start gap-3">
        {hasColorPreview ? (
          <TokenPreviewSwatch value={effective} format={token.format} className="size-10" />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-sm font-medium">{token.label}</Label>
                {isOverridden ? (
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                    edited
                  </Badge>
                ) : null}
              </div>
              {token.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{token.description}</p>
              ) : null}
              <code className="mt-1 block truncate text-[11px] text-muted-foreground">
                --{token.key}
              </code>
            </div>
            {isOverridden ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 shrink-0"
                onClick={onReset}
              >
                Reset
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className={cn(!hasColorPreview && 'pt-0')}>
        <TokenFormatControls token={token} value={effective} onChange={onChange} />
      </div>
    </div>
  );
}
