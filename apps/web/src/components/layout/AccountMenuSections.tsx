import type { ReactNode } from 'react';

import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@oktavius/base-ui';

import { useI18n, useTranslation } from '@/core/i18n';

import {
  CheckIcon,
  ChevronRightIcon,
  GlobeIcon,
  MoonIcon,
  OrganizationIcon,
  SunIcon,
  SystemThemeIcon,
} from '@/lib/icons';
import {
  UI_LOCALE_OPTIONS,
  UI_THEME_OPTIONS,
  useUserPreferences,
  type UiLocale,
  type UiTheme,
} from '@/lib/userPreferences';

type OrganizationMenuSectionProps = {
  activeOrgId: string | null;
  organizations: readonly {
    id: string;
    name: string;
    slug: string;
  }[];
  onSelectOrg?: (orgId: string) => void;
};

export function OrganizationMenuSection({
  activeOrgId,
  onSelectOrg,
  organizations,
}: OrganizationMenuSectionProps) {
  const activeOrg = organizations.find((org) => org.id === activeOrgId) ?? organizations[0];
  const isReadOnly = !onSelectOrg;

  if (organizations.length === 0) {
    return null;
  }

  return (
    <AccountSubmenu
      icon={<OrganizationIcon size={14} className="text-muted-foreground" />}
      label="Organisation"
      hint={activeOrg?.name}
    >
      {organizations.map((org) => {
        const isActive = org.id === activeOrg?.id;
        return (
          <DropdownMenuItem
            key={org.id}
            className="gap-2 py-2"
            disabled={isReadOnly}
            onSelect={(event) => {
              if (isReadOnly) {
                event.preventDefault();
                return;
              }
              onSelectOrg(org.id);
            }}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {isActive ? <CheckIcon size={14} weight="bold" className="text-foreground" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{org.name}</p>
              <p className="text-xs text-muted-foreground">
                {isActive ? 'Active organization' : isReadOnly ? 'Switching unavailable' : org.slug}
              </p>
            </div>
          </DropdownMenuItem>
        );
      })}
    </AccountSubmenu>
  );
}

export function LanguageMenuSection() {
  const { locale, setLocale, localeLabel } = useUserPreferences();
  const { setLanguage } = useI18n();
  const { t } = useTranslation();

  return (
    <AccountSubmenu
      icon={<GlobeIcon size={14} className="text-muted-foreground" />}
      label={t('common.language', undefined, 'Language')}
      hint={localeLabel}
    >
      {UI_LOCALE_OPTIONS.map((option) => (
        <AccountSubmenuOption
          key={option.value}
          active={locale === option.value}
          label={option.label}
          onSelect={() => {
            const next = option.value as UiLocale;
            setLocale(next);
            void setLanguage(next);
          }}
        />
      ))}
    </AccountSubmenu>
  );
}

export function DesignMenuSection() {
  const { theme, setTheme, themeLabel } = useUserPreferences();

  return (
    <AccountSubmenu
      icon={<SunIcon size={14} className="text-muted-foreground" />}
      label="Design"
      hint={themeLabel}
    >
      {UI_THEME_OPTIONS.map((option) => (
        <AccountSubmenuOption
          key={option.value}
          active={theme === option.value}
          label={option.label}
          leading={
            option.value === 'light' ? (
              <SunIcon size={14} className="text-muted-foreground" />
            ) : option.value === 'dark' ? (
              <MoonIcon size={14} className="text-muted-foreground" />
            ) : (
              <SystemThemeIcon size={14} className="text-muted-foreground" />
            )
          }
          onSelect={() => setTheme(option.value as UiTheme)}
        />
      ))}
    </AccountSubmenu>
  );
}

type AccountSubmenuProps = {
  icon: ReactNode;
  label: string;
  hint?: string;
  children: ReactNode;
};

function AccountSubmenu({ icon, label, hint, children }: AccountSubmenuProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        {icon}
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        {hint ? (
          <span className="min-w-0 flex-[0_1_45%] truncate text-right text-xs text-muted-foreground">
            {hint}
          </span>
        ) : null}
        <ChevronRightIcon size={14} className="shrink-0 text-muted-foreground" />
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        alignOffset={-4}
        className="max-h-[min(20rem,70vh)] w-56 overflow-y-auto p-1"
        sideOffset={4}
      >
        {children}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

type AccountSubmenuOptionProps = {
  active: boolean;
  label: string;
  leading?: ReactNode;
  onSelect: () => void;
};

function AccountSubmenuOption({ active, label, leading, onSelect }: AccountSubmenuOptionProps) {
  return (
    <DropdownMenuItem className="gap-2" onSelect={onSelect}>
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {active ? <CheckIcon size={14} weight="bold" className="text-foreground" /> : null}
      </span>
      {leading}
      <span className="truncate">{label}</span>
    </DropdownMenuItem>
  );
}
