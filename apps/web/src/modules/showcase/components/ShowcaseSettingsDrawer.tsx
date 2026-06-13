import {
  Button,
  cn,
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  SettingsRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@oktavius/base-ui';

import { DENSITIES, type Density } from '@/lib/density/density';
import type { DesignTokenOverridesController } from '@/lib/design-tokens/useDesignTokenOverrides';
import { useUserPreferences } from '@/lib/userPreferences';

import { TokenEditorPanel } from './TokenEditorPanel';

const DENSITY_LABELS: Record<Density, string> = {
  compact: 'Compact',
  comfortable: 'Comfortable',
  spacious: 'Spacious',
};

function DensitySegmented({
  value,
  onChange,
}: {
  value: Density;
  onChange: (value: Density) => void;
}) {
  return (
    <div className="inline-flex rounded-control border border-border p-0.5">
      {DENSITIES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'rounded-[0.4rem] px-3 py-1 text-xs font-medium transition-colors',
            value === option
              ? 'bg-sidebar-primary/10 text-sidebar-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {DENSITY_LABELS[option]}
        </button>
      ))}
    </div>
  );
}

export type ShowcaseSettingsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokens: DesignTokenOverridesController;
  density: Density;
  onDensityChange: (value: Density) => void;
  densityPersist: boolean;
  onDensityPersistChange: (value: boolean) => void;
  onResetEverything: () => void;
};

export function ShowcaseSettingsDrawer({
  open,
  onOpenChange,
  tokens,
  density,
  onDensityChange,
  densityPersist,
  onDensityPersistChange,
  onResetEverything,
}: ShowcaseSettingsDrawerProps) {
  const { theme, setTheme, locale, setLocale } = useUserPreferences();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        side="right"
        className="flex w-[min(32rem,94vw)] max-w-[94vw] flex-col gap-0 p-0"
      >
        <DrawerHeader className="border-b border-border px-4 py-3">
          <DrawerTitle>Showcase settings</DrawerTitle>
        </DrawerHeader>

        <Tabs defaultValue="appearance" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-4 mt-3 shrink-0">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          <TabsContent
            value="appearance"
            className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-3"
          >
            <SettingsRow label="Theme" description="Light, dark, or follow the system.">
              <div className="inline-flex gap-1">
                {(['light', 'dark', 'system'] as const).map((option) => (
                  <Button
                    key={option}
                    size="sm"
                    variant={theme === option ? 'secondary' : 'ghost'}
                    onClick={() => setTheme(option)}
                  >
                    {option[0]?.toUpperCase()}
                    {option.slice(1)}
                  </Button>
                ))}
              </div>
            </SettingsRow>

            <SettingsRow label="Language" description="UI locale.">
              <div className="inline-flex gap-1">
                {(['en', 'de'] as const).map((option) => (
                  <Button
                    key={option}
                    size="sm"
                    variant={locale === option ? 'secondary' : 'ghost'}
                    onClick={() => setLocale(option)}
                  >
                    {option.toUpperCase()}
                  </Button>
                ))}
              </div>
            </SettingsRow>

            <SettingsRow label="Density" description="Scales spacing and type across the app.">
              <DensitySegmented value={density} onChange={onDensityChange} />
            </SettingsRow>

            <SettingsRow
              label="Remember density"
              description="Save the density choice to localStorage."
            >
              <Button
                size="sm"
                variant={densityPersist ? 'secondary' : 'ghost'}
                onClick={() => onDensityPersistChange(!densityPersist)}
              >
                {densityPersist ? 'On' : 'Off'}
              </Button>
            </SettingsRow>
          </TabsContent>

          <TabsContent value="tokens" className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <TokenEditorPanel controller={tokens} />
          </TabsContent>
        </Tabs>

        <DrawerFooter className="border-t border-border">
          <Button variant="outline" onClick={onResetEverything}>
            Reset everything
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
