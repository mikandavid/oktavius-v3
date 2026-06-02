import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate } from 'react-router-dom';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@oktavius/base-ui';

import { SearchIcon } from '@/lib/icons';
import { useDemoData } from '@/app/demo-data';
import {
  APP_NAV_MODULES,
  getAppQuickActionsForProfile,
  isAppNavItemEnabled,
  moduleLabelFor,
  visiblePathFor,
} from '@/lib/appNavModules';
import { useOrgProfile } from '@/lib/org-profiles/useOrgProfile';
import { canAccessAppNavItem, permissionSubjectFor } from '@/lib/permissions';

type CommandPaletteContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const profile = useOrgProfile();
  const { activeMembership, currentUser } = useDemoData();
  const permissionSubject = useMemo(
    () => permissionSubjectFor(currentUser, activeMembership),
    [activeMembership, currentUser],
  );
  const navItems = useMemo(
    () =>
      APP_NAV_MODULES.filter((item) => {
        if (item.devOnly && !import.meta.env.DEV) return false;
        return isAppNavItemEnabled(profile, item) && canAccessAppNavItem(item, permissionSubject);
      }).map((item) => ({
        ...item,
        path: visiblePathFor(profile, item),
        label: moduleLabelFor(profile, item),
        group: item.section === 'admin' ? 'Admin' : 'Modules',
      })),
    [permissionSubject, profile],
  );
  const quickActions = useMemo(
    () =>
      getAppQuickActionsForProfile(profile).filter((action) => {
        const item = APP_NAV_MODULES.find((entry) => entry.id === action.routeId);
        return item
          ? isAppNavItemEnabled(profile, item) && canAccessAppNavItem(item, permissionSubject)
          : false;
      }),
    [permissionSubject, profile],
  );

  useHotkeys(
    'mod+k',
    (event) => {
      event.preventDefault();
      setOpen((current) => !current);
    },
    { enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'] },
  );

  const run = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate],
  );

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search modules, records, actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick actions">
            {quickActions.map((action) => (
              <CommandItem key={action.path} onSelect={() => run(action.path)}>
                <SearchIcon size={16} className="text-muted-foreground" />
                {action.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          {(['Modules', 'Admin'] as const).map((group) => (
            <CommandGroup key={group} heading={group}>
              {navItems
                .filter((item) => item.group === group)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem key={item.path} onSelect={() => run(item.path)}>
                      <Icon size={16} className="text-muted-foreground" />
                      {item.label}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          ))}
        </CommandList>
        <div className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <CommandShortcut>⌘</CommandShortcut>
            <CommandShortcut>K</CommandShortcut>
            <span>toggle palette</span>
          </span>
        </div>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}
