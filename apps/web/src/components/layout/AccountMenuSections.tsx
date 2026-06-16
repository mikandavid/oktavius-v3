import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  SegmentedToggle,
} from '@oktavius/base-ui';
import type { ReactNode } from 'react';

import { useI18n, useTranslation } from '@/core/i18n';
import {
  CheckIcon,
  ChevronRightIcon,
  MoonIcon,
  OrganizationIcon,
  SunIcon,
  SystemThemeIcon,
} from '@/lib/icons';
import {
  UI_LOCALE_OPTIONS,
  UI_THEME_OPTIONS,
  type UiLocale,
  type UiTheme,
  useUserPreferences,
} from '@/lib/userPreferences';

type OrganizationMenuSectionProps = {
  activeOrgId: string | null;
  organizations: readonly {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
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

  if (organizations.length === 1) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
        <OrganizationLogo name={activeOrg?.name} logoUrl={activeOrg?.logoUrl} />
        <span className="min-w-0 flex-1 truncate text-left text-foreground">Organisation</span>
        <span className="min-w-0 max-w-[45%] truncate text-right text-xs text-muted-foreground">
          {activeOrg?.name}
        </span>
      </div>
    );
  }

  return (
    <AccountSubmenu
      icon={<OrganizationLogo name={activeOrg?.name} logoUrl={activeOrg?.logoUrl} />}
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
            <OrganizationLogo name={org.name} logoUrl={org.logoUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{org.name}</p>
              <p className="text-xs text-muted-foreground">
                {isActive ? 'Active organization' : isReadOnly ? 'Switching unavailable' : org.slug}
              </p>
            </div>
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {isActive ? <CheckIcon size={14} weight="bold" className="text-foreground" /> : null}
            </span>
          </DropdownMenuItem>
        );
      })}
    </AccountSubmenu>
  );
}

function OrganizationLogo({ logoUrl, name }: { logoUrl?: string | null; name?: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name ?? 'Organization'}
        width={16}
        height={16}
        className="h-4 w-4 shrink-0 object-contain"
      />
    );
  }
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
      <OrganizationIcon size={10} weight="duotone" />
    </span>
  );
}

function IdentityPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

export function IdentityPills({
  orgName,
  role,
}: {
  orgName?: string | null;
  role?: string | null;
}) {
  if (!orgName && !role) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1.5 px-2 pb-2 pt-1">
      {orgName ? <IdentityPill>{orgName}</IdentityPill> : null}
      {role ? <IdentityPill>{role}</IdentityPill> : null}
    </div>
  );
}

const THEME_ICON: Record<UiTheme, ReactNode> = {
  light: <SunIcon size={13} className="text-muted-foreground" />,
  dark: <MoonIcon size={13} className="text-muted-foreground" />,
  system: <SystemThemeIcon size={13} className="text-muted-foreground" />,
};

function PreferenceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
      <span className="min-w-0 flex-1 truncate text-left text-foreground">{label}</span>
      {children}
    </div>
  );
}

export function ThemeMenuRow() {
  const { theme, setTheme } = useUserPreferences();
  const { t } = useTranslation();
  const label = t('common.theme', undefined, 'Theme');
  return (
    <PreferenceRow label={label}>
      <SegmentedToggle
        ariaLabel={label}
        value={theme}
        onChange={(value) => setTheme(value as UiTheme)}
        options={UI_THEME_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
          icon: THEME_ICON[option.value],
          ariaLabel: option.label,
        }))}
      />
    </PreferenceRow>
  );
}

export function LanguageMenuRow() {
  const { locale, setLocale } = useUserPreferences();
  const { setLanguage } = useI18n();
  const { t } = useTranslation();
  const label = t('common.language', undefined, 'Language');
  return (
    <PreferenceRow label={label}>
      <SegmentedToggle
        ariaLabel={label}
        value={locale}
        onChange={(value) => {
          const next = value as UiLocale;
          setLocale(next);
          void setLanguage(next);
        }}
        options={UI_LOCALE_OPTIONS.map((option) => ({
          value: option.value,
          label: option.value.toUpperCase(),
          ariaLabel: option.label,
        }))}
      />
    </PreferenceRow>
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
