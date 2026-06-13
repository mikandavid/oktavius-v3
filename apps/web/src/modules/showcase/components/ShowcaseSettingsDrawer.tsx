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
import { UI_LOCALE_OPTIONS, UI_THEME_OPTIONS, useUserPreferences } from '@/lib/userPreferences';

import { TokenEditorPanel } from './TokenEditorPanel';

const DENSITY_LABELS: Record<Density, string> = {
  compact: 'Compact',
  comfortable: 'Comfortable',
  spacious: 'Spacious',
};

const toggleVariant = (active: boolean): 'secondary' | 'ghost' => (active ? 'secondary' : 'ghost');

function DensitySegmented({
  value,
  onChange,
}: {
  value: Density;
  onChange: (value: Density) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Density"
      className="inline-flex rounded-control border border-border p-0.5"
    >
      {DENSITIES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
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
              <div role="group" aria-label="Theme" className="inline-flex gap-1">
                {UI_THEME_OPTIONS.map(({ value, label }) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={toggleVariant(theme === value)}
                    aria-pressed={theme === value}
                    onClick={() => setTheme(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </SettingsRow>

            <SettingsRow label="Language" description="UI locale.">
              <div role="group" aria-label="Language" className="inline-flex gap-1">
                {UI_LOCALE_OPTIONS.map(({ value, label }) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={toggleVariant(locale === value)}
                    aria-pressed={locale === value}
                    onClick={() => setLocale(value)}
                  >
                    {label}
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
                variant={toggleVariant(densityPersist)}
                aria-pressed={densityPersist}
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
