import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
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

import {
  BotIcon,
  CalendarIcon,
  CaseIcon,
  ContractIcon,
  DocumentIcon,
  HomeIcon,
  IncidentIcon,
  InvoiceIcon,
  OrderIcon,
  ProductIcon,
  ProjectIcon,
  ProjectsIcon,
  ReportsIcon,
  SearchIcon,
  Settings2Icon,
  SuperadminIcon,
  TasksIcon,
  UsersIcon,
} from '@/lib/icons';

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

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: HomeIcon, group: 'Modules' },
  { label: 'Reports', path: '/reports', icon: ReportsIcon, group: 'Modules' },
  { label: 'Cases', path: '/cases', icon: CaseIcon, group: 'Modules' },
  { label: 'Case board', path: '/cases/board', icon: CaseIcon, group: 'Modules' },
  { label: 'Incidents', path: '/incidents', icon: IncidentIcon, group: 'Modules' },
  { label: 'Clients', path: '/clients', icon: ProjectsIcon, group: 'Modules' },
  { label: 'Contracts', path: '/contracts', icon: ContractIcon, group: 'Modules' },
  { label: 'Orders', path: '/orders', icon: OrderIcon, group: 'Modules' },
  { label: 'Invoices', path: '/invoices', icon: InvoiceIcon, group: 'Modules' },
  { label: 'Products', path: '/products', icon: ProductIcon, group: 'Modules' },
  { label: 'Projects', path: '/projects', icon: ProjectIcon, group: 'Modules' },
  { label: 'Users', path: '/users', icon: UsersIcon, group: 'Modules' },
  { label: 'Tasks', path: '/tasks', icon: TasksIcon, group: 'Modules' },
  { label: 'Documents', path: '/documents', icon: DocumentIcon, group: 'Modules' },
  { label: 'Calendar', path: '/calendar', icon: CalendarIcon, group: 'Modules' },
  { label: 'Client onboarding', path: '/clients/onboarding', icon: ProjectsIcon, group: 'Modules' },
  { label: 'AI Chat', path: '/ai-chat', icon: BotIcon, group: 'Modules' },
  { label: 'Superadmin', path: '/superadmin', icon: SuperadminIcon, group: 'Admin' },
  { label: 'Component Showcase', path: '/showcase', icon: Settings2Icon, group: 'Admin' },
] as const;

const QUICK_ACTIONS = [
  { label: 'New case', path: '/cases/new' },
  { label: 'New client', path: '/clients/new' },
  { label: 'New product', path: '/products/new' },
  { label: 'New user', path: '/users/new' },
  { label: 'New organization', path: '/superadmin/orgs/new' },
] as const;

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
            {QUICK_ACTIONS.map((action) => (
              <CommandItem key={action.path} onSelect={() => run(action.path)}>
                <SearchIcon size={16} className="text-muted-foreground" />
                {action.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          {(['Modules', 'Admin'] as const).map((group) => (
            <CommandGroup key={group} heading={group}>
              {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
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
