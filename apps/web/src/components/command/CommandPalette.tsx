import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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
import {
  APP_NAV_MODULES,
  getAppQuickActionsForProfile,
  isAppNavItemEnabled,
  moduleLabelFor,
  visiblePathFor,
} from '@/lib/appNavModules';
import { useOrgProfile } from '@/lib/org-profiles/useOrgProfile';
import {
  canAccessAppNavItem,
  canUsePermissionRequirement,
  EMPTY_PERMISSION_SUBJECT,
} from '@/lib/permissions';
import { createRouteSearchProvider } from '@/lib/search/providers/routes';
import { createRuntimeSearchProvider } from '@/lib/search/SearchRuntime';
import type { SearchProvider, SearchResult } from '@/lib/search/types';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const profile = useOrgProfile();
  const osirisRuntime = useOptionalOsirisRuntime();
  const searchRuntime = osirisRuntime?.searchRuntime;
  const permissionSubject = useMemo(
    () => osirisRuntime?.permissionSubject ?? EMPTY_PERMISSION_SUBJECT,
    [osirisRuntime?.permissionSubject],
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
  const providers = useMemo<SearchProvider[]>(() => {
    const routeItems = [
      ...quickActions.map((action) => ({
        id: `quick:${action.path}`,
        label: action.label,
        path: action.path,
        group: 'Quick actions',
        icon: <SearchIcon size={16} className="text-muted-foreground" />,
      })),
      ...navItems.map((item) => {
        const Icon = item.icon;
        return {
          id: `route:${item.path}`,
          label: item.label,
          path: item.path,
          group: item.group,
          icon: <Icon size={16} className="text-muted-foreground" />,
        };
      }),
    ];

    const entityProviders = searchRuntime ? [createRuntimeSearchProvider(searchRuntime)] : [];

    return [createRouteSearchProvider(routeItems), ...entityProviders].filter((provider) =>
      canUsePermissionRequirement(permissionSubject, provider.permission),
    );
  }, [navItems, permissionSubject, quickActions, searchRuntime]);

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

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setIsSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      void Promise.all(providers.map((provider) => provider.search(query, controller.signal)))
        .then((providerResults) => {
          if (controller.signal.aborted) return;
          setResults(providerResults.flat());
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, providers, query]);

  const groupedResults = useMemo(() => {
    return results.reduce(
      (groups, result) => {
        if (!groups[result.groupId]) groups[result.groupId] = [];
        groups[result.groupId].push(result);
        return groups;
      },
      {} as Record<string, SearchResult[]>,
    );
  }, [results]);
  const groupEntries = Object.entries(groupedResults);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search modules, records, actions…"
        />
        <CommandList>
          <CommandEmpty>{isSearching ? 'Searching…' : 'No results found.'}</CommandEmpty>
          {groupEntries.map(([group, groupResults], index) => (
            <CommandGroup key={group} heading={group}>
              {index > 0 ? <CommandSeparator /> : null}
              {groupResults.map((result) => (
                <CommandItem
                  key={`${result.groupId}:${result.id}`}
                  onSelect={() => run(result.href)}
                >
                  {result.icon ?? <SearchIcon size={16} className="text-muted-foreground" />}
                  <span className="min-w-0">
                    <span className="block truncate">{result.title}</span>
                    {result.subtitle ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
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
