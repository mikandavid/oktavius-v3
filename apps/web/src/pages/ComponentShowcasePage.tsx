import { useEffect, useState } from 'react';

import {
  AlertBanner,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AttachmentList,
  type Attachment,
  Avatar,
  avatarInitials,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  CollapsibleSection,
  Combobox,
  ConfirmPopover,
  CopyButton,
  CountBadge,
  DatePicker,
  DateRangePicker,
  DetailSkeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FileInput,
  InlineEdit,
  InlineEmptyState,
  Label,
  ListRow,
  MoneyText,
  MouseTooltip,
  MultiSelect,
  NumberInput,
  PageSkeleton,
  RelativeTime,
  ScrollArea,
  SectionCard,
  Separator,
  SettingsLayout,
  SettingsRow,
  SettingsSection,
  SplitView,
  StatCard,
  StatusDotLabel,
  StepperLayout,
  Switch,
  TagsInput,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Timeline,
  type TimelineEvent,
} from '@oktavius/base-ui';
import {
  SuccessIcon as CheckCircle,
  DeleteIcon,
  EditIcon,
  ErrorIcon,
  InfoIcon,
  PlusIcon,
  WarningIcon,
} from '@/lib/icons';
import { toast } from '@/lib/toast';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { EmptyState } from '@/components/common/EmptyState';
import { InfoBox } from '@/components/common/InfoBox';
import { ModulePage } from '@/components/common/PageLayout';
import { BulkAction, CrudTable, type CrudColumn, type CrudRowAction } from '@/components/data/CrudTable';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { EntityForm, type FormField } from '@/components/forms/EntityForm';
import { TokenEditor } from './showcase/TokenEditor';

// ─── Types ────────────────────────────────────────────────────────────────────

type ShowcaseFormValues = {
  name: string;
  email: string;
  team: string;
  status: string;
  budget: string;
  active: boolean;
  startDate: string;
  deadline: string;
  reminderTime: string;
  permissions: string[];
  tags: string[];
  notes: string;
  terms: boolean;
};

type ShowcaseRow = {
  id: string;
  name: string;
  owner: string;
  status: 'Active' | 'Pending' | 'Suspended';
  amount: number;
  createdAt: string;
  verified: boolean;
};

const showcaseRows: ShowcaseRow[] = [
  { id: 'row_1', name: 'User provisioning', owner: 'Operations', status: 'Active', amount: 14200, createdAt: '2024-03-15', verified: true },
  { id: 'row_2', name: 'Holiday approvals', owner: 'HR', status: 'Pending', amount: 3400, createdAt: '2024-04-02', verified: false },
  { id: 'row_3', name: 'Archive cleanup', owner: 'Support', status: 'Suspended', amount: 800, createdAt: '2024-01-20', verified: false },
  { id: 'row_4', name: 'Contract renewal', owner: 'Legal', status: 'Active', amount: 72000, createdAt: '2024-02-10', verified: true },
  { id: 'row_5', name: 'Payroll run', owner: 'Finance', status: 'Pending', amount: 215000, createdAt: '2024-05-01', verified: false },
];

const showcaseColumns: CrudColumn<ShowcaseRow>[] = [
  { key: 'name', header: 'Task', render: (row) => <span className="font-medium">{row.name}</span>, sortable: true, width: '14rem' },
  { key: 'owner', header: 'Owner', render: (row) => row.owner, sortable: true, width: '8rem', hideBelow: 'sm' },
  { key: 'status', header: 'Status', type: 'status', sortable: true, width: '8rem' },
  { key: 'amount', header: 'Amount', type: 'currency', meta: { currencySymbol: '$' }, sortable: true, width: '9rem', hideBelow: 'md' },
  { key: 'createdAt', header: 'Created', type: 'date', sortable: true, width: '9rem', hideBelow: 'lg' },
  { key: 'verified', header: 'Verified', type: 'boolean', width: '6rem', hideBelow: 'md' },
];

const rowActions: CrudRowAction<ShowcaseRow>[] = [
  { key: 'edit', label: 'Edit', icon: <EditIcon size={14} />, onClick: () => undefined },
  {
    key: 'delete',
    label: 'Delete',
    icon: <DeleteIcon size={14} />,
    destructive: true,
    confirm: { title: 'Delete this record?', description: 'This action cannot be undone.', actionLabel: 'Delete' },
    onClick: () => undefined,
  },
];

const bulkActions: BulkAction[] = [
  {
    key: 'bulk-delete',
    label: 'Delete selected',
    destructive: true,
    confirm: {
      title: (count) => `Delete ${count} record${count === 1 ? '' : 's'}?`,
      description: 'This action cannot be undone.',
      actionLabel: 'Delete all',
    },
    onClick: () => undefined,
  },
];

const showcaseFields: FormField[] = [
  { name: 'name', label: 'Name', type: 'text', required: true, section: 'Identity', description: 'Plain text input.' },
  { name: 'email', label: 'Email', type: 'email', required: true, section: 'Identity' },
  { name: 'team', label: 'Team (combobox)', type: 'combobox', options: [{ value: 'ops', label: 'Operations', description: 'Infra & DevOps' }, { value: 'hr', label: 'Human Resources' }, { value: 'finance', label: 'Finance' }, { value: 'legal', label: 'Legal' }], section: 'Assignment' },
  { name: 'status', label: 'Status (select)', type: 'select', options: ['Active', 'Pending', 'Suspended'], required: true, section: 'Assignment' },
  { name: 'budget', label: 'Budget', type: 'currency', currencySymbol: '$', section: 'Assignment', placeholder: '0.00' },
  { name: 'active', label: 'Active', type: 'switch', section: 'Assignment' },
  { name: 'startDate', label: 'Start Date', type: 'date', section: 'Schedule' },
  { name: 'deadline', label: 'Deadline (date + time)', type: 'datetime', section: 'Schedule', minuteStep: 15 },
  { name: 'reminderTime', label: 'Reminder Time', type: 'time', section: 'Schedule' },
  { name: 'permissions', label: 'Permissions (multiselect)', type: 'multiselect', options: [{ value: 'read', label: 'Read' }, { value: 'write', label: 'Write' }, { value: 'delete', label: 'Delete' }], section: 'Additional' },
  { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'Add tag…', section: 'Additional', description: 'Enter tags and press Enter or comma.' },
  { name: 'notes', label: 'Notes', type: 'textarea', section: 'Additional', colSpan: 2, description: 'Long-form text field.' },
  { name: 'terms', label: 'Terms', type: 'checkbox', placeholder: 'I agree to the terms', section: 'Additional' },
];

const demoAttachments: Attachment[] = [
  { id: 'att_1', name: 'contract-2024.pdf', mimeType: 'application/pdf', size: 204800, uploadedAt: '2024-03-15', uploadedBy: 'Anna Hofer', url: '#' },
  { id: 'att_2', name: 'photo_client.jpg', mimeType: 'image/jpeg', size: 1048576, uploadedAt: '2024-04-01', url: '#' },
  { id: 'att_3', name: 'death_certificate.docx', size: 32768, uploadedAt: '2024-04-02' },
];

// ─── Section divider ──────────────────────────────────────────────────────────

function Section({
  id,
  label,
  description,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="space-y-4 scroll-mt-28">
      <div className="flex items-center gap-3 pt-2">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
        <div className="h-px flex-1 bg-border/60" />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground -mt-2">{description}</p>
      )}
      {children}
    </div>
  );
}

// ─── Nav bar ──────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'tokens',   label: 'Tokens' },
  { id: 'actions',  label: 'Actions' },
  { id: 'inputs',   label: 'Inputs' },
  { id: 'display',  label: 'Display' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'layout',   label: 'Layout' },
  { id: 'data',     label: 'Data & Forms' },
  { id: 'nav',      label: 'Navigation' },
  { id: 'patterns', label: 'Patterns' },
];

function ShowcaseNav() {
  const [active, setActive] = useState<string>(NAV[0].id);

  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const scroller = document.getElementById('app-main-content');
    if (scroller) {
      const scrollerRect = scroller.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = 112;
      const target = scroller.scrollTop + (elRect.top - scrollerRect.top) - offset;
      scroller.scrollTo({ top: target, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActive(id);
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav
      aria-label="Showcase sections"
      className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 lg:block"
    >
      <ul className="flex flex-col gap-0.5 rounded-card border border-border/60 bg-background/90 p-2 shadow-elevated backdrop-blur-md">
        {NAV.map((n) => {
          const isActive = active === n.id;
          return (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                onClick={(e) => handleClick(e, n.id)}
                aria-current={isActive ? 'true' : undefined}
                className={[
                  'group flex items-center gap-2 rounded-control px-2.5 py-1.5 text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                ].join(' ')}
              >
                <span
                  aria-hidden
                  className={[
                    'h-1.5 w-1.5 rounded-full transition-colors',
                    isActive ? 'bg-cta' : 'bg-border group-hover:bg-muted-foreground/60',
                  ].join(' ')}
                />
                {n.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ComponentShowcasePage() {
  const [lastSubmit, setLastSubmit] = useState<ShowcaseFormValues | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dateVal, setDateVal] = useState<string | undefined>();
  const [datetimeVal, setDatetimeVal] = useState<string | undefined>();
  const [timeVal, setTimeVal] = useState<string | undefined>();
  const [comboVal, setComboVal] = useState<string | undefined>();
  const [switchVal, setSwitchVal] = useState(false);
  const [checkboxVal, setCheckboxVal] = useState(false);
  const [multiVal, setMultiVal] = useState<string[]>([]);
  const [tagsVal, setTagsVal] = useState<string[]>([]);
  const [numberVal, setNumberVal] = useState<string>('');
  const [sort, setSort] = useState('name');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showLoading, setShowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [wizardStep, setWizardStep] = useState(0);
  const [settingsKey, setSettingsKey] = useState('general');
  const [inlineVal, setInlineVal] = useState('Apex Technologies GmbH');
  const [fileVal, setFileVal] = useState<File | null>(null);
  const [rangeStart, setRangeStart] = useState<string | undefined>();
  const [rangeEnd, setRangeEnd] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingAttachment, setDeletingAttachment] = useState<string | undefined>();

  const sortedRows = [...showcaseRows].sort((a, b) => {
    const key = sort.startsWith('-') ? sort.slice(1) : sort;
    const desc = sort.startsWith('-');
    const l = String((a as Record<string, unknown>)[key] ?? '');
    const r = String((b as Record<string, unknown>)[key] ?? '');
    const result = l.localeCompare(r, undefined, { numeric: true, sensitivity: 'base' });
    return desc ? -result : result;
  });

  return (
    <ModulePage
      title="Component Showcase"
      subtitle="Live design reference with adjustable design tokens. Use the panel (bottom-right) to customize radius, shadow, and color."
    >
      <InfoBox tone="info" icon={<InfoIcon size={18} weight="fill" />} title="Token Editor">
        Open the settings panel (bottom-right ⚙) to adjust border radius, shadows, accent color, and fonts live. Changes apply instantly across all components.
      </InfoBox>

      <ShowcaseNav />

      {/* ═══════════════════════════════════════════════════════════════════════
          § 0  DESIGN TOKENS
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        id="tokens"
        label="Design Tokens"
        description="CSS custom properties that drive all visual surfaces. Change once in globals.css — every component updates."
      >
        <Card>
          <CardHeader><CardTitle>Current token defaults</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-0 divide-y divide-border/50 text-sm">
              {/* Header row */}
              <div className="col-span-2 grid grid-cols-[1fr_1fr_auto] gap-4 pb-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">CSS var</span>
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Tailwind class</span>
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Default</span>
              </div>
              {[
                { name: '--radius-card',    cls: 'rounded-card',    def: '0.75rem' },
                { name: '--radius-control', cls: 'rounded-control', def: '0.5rem' },
                { name: '--radius-badge',   cls: 'rounded-badge',   def: '0.25rem' },
                { name: '--shadow-card',    cls: 'shadow-card',     def: 'subtle' },
                { name: '--shadow-elevated',cls: 'shadow-elevated', def: 'medium' },
                { name: '--transition-base',cls: '(none)',          def: '150ms' },
              ].map((row) => (
                <div
                  key={row.name}
                  className="col-span-2 grid grid-cols-[1fr_1fr_auto] items-center gap-4 py-2"
                >
                  <code className="font-mono text-xs text-foreground">{row.name}</code>
                  <code className="font-mono text-xs text-muted-foreground">{row.cls}</code>
                  <span className="text-xs text-muted-foreground">{row.def}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground border-t border-border/60 pt-3">
              All values are CSS custom properties. The Token Editor (⚙ bottom-right) lets you adjust them live.
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════════
          § 1  ACTIONS
          Button · DropdownMenu · AlertDialog · ConfirmPopover · ConfirmActionDialog
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        id="actions"
        label="Actions"
        description={'Buttons are the primary interaction unit. One variant="cta" per page region. Use ghost for icon-only buttons (always with a Tooltip). For destructive actions, require confirmation.'}
      >

        {/* Buttons */}
        <Card>
          <CardHeader><CardTitle>Button variants</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="cta">CTA — primary action</Button>
              <Button>Default — secondary confirmed</Button>
              <Button variant="outline">Outline — toolbar / export</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost — icon / inline</Button>
              <Button variant="destructive">Destructive — delete</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline">sm</Button>
              <Button size="sm" variant="cta">sm cta</Button>
              <Button size="icon" variant="ghost"><PlusIcon size={16} /></Button>
              <Button disabled>Disabled</Button>
            </div>
          </CardContent>
        </Card>

        {/* DropdownMenu + AlertDialog */}
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>DropdownMenu</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">Action/kebab menus. CrudTable row actions use this internally.</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Open menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => toast.info('Edit clicked')}>
                      <EditIcon size={14} className="mr-2" />Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info('Duplicate')}>Duplicate</DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => toast.error('Delete clicked')}>
                    <DeleteIcon size={14} className="mr-2" />Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>AlertDialog · ConfirmPopover · ConfirmActionDialog</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                <strong>AlertDialog</strong> — blocks UI, irreversible actions. <strong>ConfirmPopover</strong> — inline, lighter. <strong>ConfirmActionDialog</strong> — shared destructive pattern.
              </p>
              <div className="flex flex-wrap gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">AlertDialog</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Blocks all interaction until resolved. Use for truly irreversible actions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => toast.error('Deleted.')}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <ConfirmPopover
                  title="Archive this client?"
                  onConfirm={() => toast.warning('Archived.')}
                  trigger={<Button variant="outline" size="sm">ConfirmPopover</Button>}
                />

                <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
                  ConfirmActionDialog
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════════
          § 2  INPUTS
          Input · Textarea · NumberInput · Checkbox · Switch · Select · Combobox
          MultiSelect · TagsInput · DatePicker · DateRangePicker · FileInput
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        id="inputs"
        label="Inputs"
        description="All form fields go through EntityForm in production. These standalone atoms are for composition. All single-line inputs are h-9."
      >

        {/* Text inputs */}
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Input · Textarea · NumberInput</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Input (text)</Label>
                <input
                  type="text"
                  className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Single-line text…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Textarea</Label>
                <Textarea placeholder="Multi-line notes…" rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>NumberInput (thousands formatting on blur)</Label>
                <NumberInput value={numberVal} onChange={setNumberVal} placeholder="0.00" />
                {numberVal ? <p className="font-mono text-xs text-muted-foreground">{numberVal}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label>NumberInput — integer, disabled</Label>
                <div className="flex gap-2">
                  <NumberInput value={1234567} decimals={0} className="flex-1" />
                  <NumberInput value={99.9} disabled className="flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Checkbox · Switch</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">Checkbox</p>
                <div className="flex items-center gap-2">
                  <Checkbox id="sc-cb1" checked={checkboxVal} onCheckedChange={(v) => setCheckboxVal(Boolean(v))} />
                  <Label htmlFor="sc-cb1">Accept terms and conditions</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="sc-cb2" defaultChecked />
                  <Label htmlFor="sc-cb2">Send notifications (default checked)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="sc-cb3" disabled />
                  <Label htmlFor="sc-cb3" className="text-muted-foreground">Disabled</Label>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">Switch</p>
                <div className="flex items-center gap-2">
                  <Switch checked={switchVal} onCheckedChange={setSwitchVal} />
                  <span className="text-sm text-muted-foreground">{switchVal ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch defaultChecked />
                  <span className="text-sm text-muted-foreground">Default on</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch disabled />
                  <span className="text-sm text-muted-foreground">Disabled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selects */}
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Combobox (searchable select)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Basic</p>
                <Combobox
                  options={[
                    { value: 'ops', label: 'Operations', description: 'Infra & DevOps' },
                    { value: 'hr', label: 'Human Resources' },
                    { value: 'finance', label: 'Finance' },
                    { value: 'legal', label: 'Legal' },
                  ]}
                  value={comboVal}
                  onChange={(v) => setComboVal(v ?? undefined)}
                  placeholder="Pick a team"
                />
                {comboVal ? <p className="font-mono text-xs text-muted-foreground">{comboVal}</p> : null}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">With create + footer</p>
                <Combobox
                  options={[{ value: 't1', label: 'Tag Alpha' }, { value: 't2', label: 'Tag Beta' }]}
                  placeholder="Search tags…"
                  onCreate={{ label: '+ New tag', onSubmit: async (l) => { toast.success(`Created: ${l}`); return l; } }}
                  footerAction={{ label: 'Manage tags →', onClick: () => { toast.info('Navigate to /tags'); } }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>MultiSelect · TagsInput</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">MultiSelect</p>
                <MultiSelect
                  options={[
                    { value: 'read', label: 'Read', description: 'View records' },
                    { value: 'write', label: 'Write', description: 'Create & edit' },
                    { value: 'delete', label: 'Delete', description: 'Remove records' },
                    { value: 'admin', label: 'Admin', description: 'Full access' },
                  ]}
                  value={multiVal}
                  onChange={setMultiVal}
                  placeholder="Pick permissions"
                />
                {multiVal.length > 0 ? (
                  <p className="font-mono text-xs text-muted-foreground">[{multiVal.join(', ')}]</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">TagsInput (free-form, Enter or comma)</p>
                <TagsInput value={tagsVal} onChange={setTagsVal} placeholder="Add tag, press Enter" />
                {tagsVal.length > 0 ? (
                  <p className="font-mono text-xs text-muted-foreground">[{tagsVal.join(', ')}]</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date + file */}
        <Card>
          <CardHeader><CardTitle>DatePicker · DateRangePicker · FileInput</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">DatePicker — date</p>
                <DatePicker mode="date" value={dateVal} onChange={(v) => setDateVal(v ?? undefined)} />
                {dateVal ? <p className="font-mono text-xs text-muted-foreground">{dateVal}</p> : null}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">DatePicker — datetime (15min step)</p>
                <DatePicker mode="datetime" value={datetimeVal} minuteStep={15} onChange={(v) => setDatetimeVal(v ?? undefined)} />
                {datetimeVal ? <p className="font-mono text-xs text-muted-foreground">{datetimeVal}</p> : null}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">DatePicker — time</p>
                <DatePicker mode="time" value={timeVal} onChange={(v) => setTimeVal(v ?? undefined)} />
                {timeVal ? <p className="font-mono text-xs text-muted-foreground">{timeVal}</p> : null}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">DateRangePicker</p>
                <DateRangePicker
                  startValue={rangeStart}
                  endValue={rangeEnd}
                  onStartChange={(v) => setRangeStart(v ?? undefined)}
                  onEndChange={(v) => setRangeEnd(v ?? undefined)}
                />
                {(rangeStart || rangeEnd) ? (
                  <p className="font-mono text-xs text-muted-foreground">{rangeStart ?? '—'} → {rangeEnd ?? '—'}</p>
                ) : null}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground">FileInput — drag & drop, emits File | null</p>
                <FileInput
                  value={fileVal}
                  accept=".pdf,.docx,image/*"
                  onChange={setFileVal}
                  placeholder="Drop a document or click to browse"
                />
                {fileVal ? <p className="text-xs text-muted-foreground">Selected: {fileVal.name}</p> : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════════
          § 3  DISPLAY ATOMS
          Badge · StatusBadge · Avatar · StatusDot · CountBadge
          MoneyText · RelativeTime · CopyButton
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        id="display"
        label="Display Atoms"
        description="Atomic display components. StatusBadge handles all status rendering — never build custom colored badges."
      >

        {/* Badge + StatusBadge */}
        <Card>
          <CardHeader><CardTitle>Badge · StatusBadge</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Neutral</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="destructive">Error</Badge>
            </div>
            <p className="text-xs text-muted-foreground">StatusBadge — maps string to variant automatically</p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="Active" />
              <StatusBadge status="Pending" />
              <StatusBadge status="Suspended" />
              <StatusBadge status="draft" label="Draft" variantMap={{ draft: 'warning' }} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-3">
          {/* Avatar */}
          <Card>
            <CardHeader><CardTitle>Avatar</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <Avatar label="Anna Hofer" size="xs" />
                <Avatar label="Markus Leitner" size="sm" />
                <Avatar label="Nina Weiss" size="md" />
                <Avatar label="John Doe" size="lg" tone="primary" />
                <Avatar label="AB" abbreviation="AB" size="md" tone="accent" />
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                avatarInitials("Anna Hofer") = "{avatarInitials('Anna Hofer')}"
              </p>
            </CardContent>
          </Card>

          {/* StatusDot + CountBadge */}
          <Card>
            <CardHeader><CardTitle>StatusDot · CountBadge</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <StatusDotLabel tone="success" value={12}>Active clients</StatusDotLabel>
              <StatusDotLabel tone="warning" value={3}>Expiring contracts</StatusDotLabel>
              <StatusDotLabel tone="destructive" value={1}>Overdue tasks</StatusDotLabel>
              <StatusDotLabel tone="info">Syncing data</StatusDotLabel>
              <StatusDotLabel tone="muted">Archived</StatusDotLabel>
              <Separator />
              <div className="space-y-1.5">
                {[
                  { label: 'Clients', count: 142, variant: undefined },
                  { label: 'Messages', count: 5, variant: 'secondary' as const },
                  { label: 'Overdue', count: 3, variant: 'destructive' as const },
                  { label: 'Empty (hidden)', count: 0, variant: undefined },
                ].map(({ label, count, variant }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <span>{label}</span>
                    <CountBadge count={count} hideZero={count === 0} variant={variant} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* MoneyText + RelativeTime + CopyButton */}
          <Card>
            <CardHeader><CardTitle>MoneyText · RelativeTime · CopyButton</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">MoneyText</p>
                <div className="space-y-1 font-mono text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground text-xs">EUR (de-AT)</span><MoneyText value={14250.5} /></div>
                  <div className="flex justify-between"><span className="text-muted-foreground text-xs">USD</span><MoneyText value={72000} currency="USD" locale="en-US" /></div>
                  <div className="flex justify-between"><span className="text-muted-foreground text-xs">Compact</span><MoneyText value={1430000} compact /></div>
                  <div className="flex justify-between"><span className="text-muted-foreground text-xs">Null</span><MoneyText value={null} /></div>
                </div>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">RelativeTime</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs text-muted-foreground">Past</span>
                    <RelativeTime date="2024-01-15T10:00:00Z" />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs text-muted-foreground">Recent</span>
                    <RelativeTime date={new Date(Date.now() - 1000 * 60 * 12)} />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs text-muted-foreground">Future</span>
                    <RelativeTime date={new Date(Date.now() + 1000 * 60 * 60 * 48)} />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs text-muted-foreground">Invalid</span>
                    <RelativeTime date="not-a-date" />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">CopyButton</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">cli_1001</span>
                  <CopyButton value="cli_1001" label="Copy ID" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════════
          § 4  FEEDBACK
          AlertBanner · InfoBox · Toast · EmptyState · PageSkeleton · DetailSkeleton
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        id="feedback"
        label="Feedback"
        description="AlertBanner mounts above ModulePage (full-width). InfoBox is inline contextual. Toast is for action feedback. PageSkeleton / DetailSkeleton for loading states."
      >

        {/* AlertBanner */}
        <Card>
          <CardHeader><CardTitle>AlertBanner — full-width page-top notices</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <AlertBanner tone="info">Scheduled maintenance on Sunday 02:00–04:00 UTC.</AlertBanner>
            <AlertBanner tone="success">Migration completed. All data is up to date.</AlertBanner>
            <AlertBanner tone="warning">Trial expires in 7 days. <a href="#" className="underline">Upgrade now.</a></AlertBanner>
            <AlertBanner tone="destructive" dismissible onDismiss={() => undefined}>
              Critical error in payment processor. Contact support immediately.
            </AlertBanner>
          </CardContent>
        </Card>

        {/* InfoBox + EmptyState */}
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>InfoBox — inline contextual alert</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <InfoBox tone="info" icon={<InfoIcon size={18} weight="fill" />} title="Info">
                Informational guidance for a normal ERP flow.
              </InfoBox>
              <InfoBox tone="success" icon={<CheckCircle size={18} weight="fill" />} title="Success">
                Positive state confirmation after a completed action.
              </InfoBox>
              <InfoBox tone="warning" icon={<WarningIcon size={18} weight="fill" />} title="Warning">
                Attention required before continuing.
              </InfoBox>
              <InfoBox tone="destructive" icon={<ErrorIcon size={18} weight="fill" />} title="Error">
                Shared failure state styling for errors and blocked actions.
              </InfoBox>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>EmptyState · Toast</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <EmptyState
                title="No records found"
                description="Page-level zero state. Use InlineEmptyState inside SectionCard."
                action={<Button variant="cta" size="sm">Create record</Button>}
              />
              <Separator />
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Toast — import from @/lib/toast</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.success('Record saved.')}>Success</Button>
                  <Button variant="outline" size="sm" onClick={() => toast.error('Failed to save.')}>Error</Button>
                  <Button variant="outline" size="sm" onClick={() => toast.warning('Expires in 7 days.')}>Warning</Button>
                  <Button variant="outline" size="sm" onClick={() => toast.info('3 items selected.')}>Info</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.promise(new Promise((r) => setTimeout(r, 1500)), { loading: 'Saving…', success: 'Saved!', error: 'Failed.' })}
                  >
                    Promise
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skeletons */}
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>PageSkeleton — list page load state</CardTitle></CardHeader>
            <CardContent><PageSkeleton /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>DetailSkeleton — detail page load state</CardTitle></CardHeader>
            <CardContent><DetailSkeleton /></CardContent>
          </Card>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════════
          § 5  LAYOUT & STRUCTURE
          SectionCard · ListRow · InlineEmptyState · CollapsibleSection
          Tabs · SplitView · SettingsLayout · StepperLayout
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        id="layout"
        label="Layout & Structure"
        description="SectionCard replaces Card for all content sections inside detail pages. Use Tabs for complex entities with multiple domains. Never nest Card inside Card."
      >

        {/* SectionCard + ListRow */}
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">SectionCard + ListRow variants</p>
            <SectionCard
              title="Parties"
              meta="3 linked"
              actions={<Button variant="ghost" size="sm"><PlusIcon size={14} /> Add</Button>}
            >
              <div className="space-y-2">
                <ListRow
                  title="Anna Hofer"
                  subtitle="Account Manager · Operations"
                  trailing={<StatusBadge status="Active" />}
                />
                <ListRow
                  title="Markus Leitner"
                  subtitle="Legal representative"
                  variant="muted"
                  trailing={<Badge variant="outline">Pending</Badge>}
                />
                <ListRow
                  title="Contract signed"
                  subtitle="Click to open detail"
                  variant="dashed"
                  onClick={() => undefined}
                  trailing={<Badge variant="secondary">→</Badge>}
                />
              </div>
            </SectionCard>
            <SectionCard title="Warnings" meta="1 action required">
              <ListRow
                title="Contract expiring soon"
                subtitle="Renewal due in 12 days"
                variant="warning"
                trailing={<Button variant="outline" size="sm">Renew</Button>}
              />
            </SectionCard>
            <SectionCard title="Empty section">
              <InlineEmptyState text="No items yet. Add one above." centered />
            </SectionCard>
          </div>

          {/* CollapsibleSection */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">CollapsibleSection</p>
            <CollapsibleSection
              title="Contract details"
              badge={<Badge variant="secondary">3 fields</Badge>}
              defaultOpen
            >
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Contract start: 2024-01-15</p>
                <p>Contract end: 2025-01-14</p>
                <p>Annual revenue: € 480,000</p>
              </div>
            </CollapsibleSection>
            <CollapsibleSection
              title="Notes & history"
              actions={<Button variant="ghost" size="sm"><PlusIcon size={14} /></Button>}
            >
              <p className="text-sm text-muted-foreground">
                Key strategic account. Renewal due Q1. Post-mortem completed after last incident.
              </p>
            </CollapsibleSection>
            <CollapsibleSection
              title="Advanced settings"
              variant="plain"
              badge={<Badge variant="outline">plain variant</Badge>}
            >
              <p className="text-sm text-muted-foreground">
                Plain variant — no border. Used in narrow sidebars or settings panels.
              </p>
            </CollapsibleSection>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Tabs — complex entity workspace pages. <code className="font-mono font-normal">attention</code> prop shows warning dot.
          </p>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="parties" attention>Parties</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <SectionCard title="Case overview" meta="All sections below">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Status</p>
                    <StatusBadge status="Active" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Account Manager</p>
                    <p className="text-sm text-foreground">Anna Hofer</p>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>
            <TabsContent value="parties">
              <SectionCard title="Linked parties" actions={<Button variant="ghost" size="sm"><PlusIcon size={14} /> Add</Button>}>
                <div className="space-y-2">
                  <ListRow title="Anna Hofer" subtitle="Account Manager" trailing={<Badge variant="success">Primary</Badge>} />
                  <InlineEmptyState text="No additional parties." />
                </div>
              </SectionCard>
            </TabsContent>
            <TabsContent value="documents">
              <SectionCard title="Documents">
                <InlineEmptyState text="No documents attached. Upload one to start." centered />
              </SectionCard>
            </TabsContent>
            <TabsContent value="notes">
              <SectionCard title="Notes">
                <p className="text-sm text-muted-foreground">Key strategic account. Renewal due Q1.</p>
              </SectionCard>
            </TabsContent>
          </Tabs>
        </div>

        {/* SplitView + StepperLayout */}
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">SplitView — master-detail</p>
            <SplitView
              sidebarWidth="w-44"
              sidebar={
                <div className="space-y-1 p-2">
                  {['Apex Tech', 'Bruckner', 'Eiger Ltd'].map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              }
              className="h-32"
            >
              <div className="p-4">
                <p className="text-sm font-medium text-foreground">Apex Technologies GmbH</p>
                <p className="mt-1 text-xs text-muted-foreground">Select a client from the sidebar.</p>
              </div>
            </SplitView>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">StepperLayout — multi-step wizard</p>
            <StepperLayout
              steps={[
                { key: 'identity', label: 'Identity', description: 'Name & type' },
                { key: 'contact', label: 'Contact', description: 'Email & phone' },
                { key: 'contract', label: 'Contract', description: 'Dates & value' },
                { key: 'review', label: 'Review' },
              ]}
              currentStep={wizardStep}
              footer={
                <>
                  <Button variant="outline" disabled={wizardStep === 0} onClick={() => setWizardStep((s) => s - 1)}>Back</Button>
                  {wizardStep < 3 ? (
                    <Button variant="default" onClick={() => setWizardStep((s) => s + 1)}>Next</Button>
                  ) : (
                    <Button variant="default" onClick={() => { setWizardStep(0); toast.success('Wizard completed.'); }}>Submit</Button>
                  )}
                </>
              }
            >
              <SectionCard title={`Step ${wizardStep + 1} content`}>
                <p className="text-sm text-muted-foreground">
                  Content for step {wizardStep + 1}. Replace with EntityForm or custom fields per step.
                </p>
              </SectionCard>
            </StepperLayout>
          </div>
        </div>

        {/* SettingsLayout */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">SettingsLayout</p>
          <SettingsLayout
            items={[
              { key: 'general', label: 'General' },
              { key: 'members', label: 'Members' },
              { key: 'notifications', label: 'Notifications' },
              { key: 'integrations', label: 'Integrations' },
            ]}
            activeKey={settingsKey}
            onSelect={setSettingsKey}
          >
            {settingsKey === 'general' ? (
              <SettingsSection title="General settings" description="Manage your organization name and locale.">
                <SettingsRow label="Organization name" description="Shown in reports and exports.">
                  <Button variant="outline" size="sm">Edit</Button>
                </SettingsRow>
                <SettingsRow label="Two-factor authentication" description="Require 2FA for all team members.">
                  <Switch />
                </SettingsRow>
              </SettingsSection>
            ) : (
              <p className="text-sm text-muted-foreground">Select a settings section from the nav.</p>
            )}
          </SettingsLayout>
        </div>

      </Section>

      {/* ═══════════════════════════════════════════════════════════════════════
          § 6  DATA & FORMS
          EntityForm · DetailView · CrudTable · AttachmentList · StatCard · Timeline
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        id="data"
        label="Data & Forms"
        description="CrudTable / CrudMainView for all list views. EntityForm for all create/edit forms. DetailView for read-only records."
      >

        {/* EntityForm + DetailView */}
        <div className="grid gap-4 xl:grid-cols-2">
          <EntityForm<ShowcaseFormValues>
            title="EntityForm — all 13 field types"
            subtitle="Submit to inspect values."
            fields={showcaseFields}
            defaultValues={{
              name: '', email: '', team: '', status: 'Pending', budget: '',
              active: false, startDate: '', deadline: '', reminderTime: '',
              permissions: [], tags: [], notes: '', terms: false,
            }}
            submitLabel="Save sample"
            onSubmit={(values) => setLastSubmit(values)}
          />

          <div className="space-y-4">
            <DetailView
              title="DetailView — read-only grouped record"
              subtitle="Use on detail pages for flat field display."
              fields={[
                { key: 'id', label: 'Record ID', value: <span className="font-mono text-xs">dbg_001</span>, section: 'Identity' },
                { key: 'owner', label: 'Owner', value: 'Frontend extraction', section: 'Identity' },
                { key: 'state', label: 'State', value: <StatusBadge status="Active" />, section: 'State' },
                { key: 'theme', label: 'Theme', value: 'Osiris-derived border-led UI', section: 'State' },
              ]}
            />
            <Card>
              <CardHeader><CardTitle>Last Form Submit</CardTitle></CardHeader>
              <CardContent>
                {lastSubmit ? (
                  <pre className="overflow-auto rounded-card bg-muted/50 p-3 font-mono text-xs text-foreground">
                    {JSON.stringify(lastSubmit, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">Submit the sample form above to inspect values.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CrudTable */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">CrudTable — Lytenyte virtualized grid</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Sortable, selectable, bulk actions, typed cells (status / currency / date / boolean). Drag columns to resize.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setShowLoading(true); setTimeout(() => setShowLoading(false), 2000); }}>
              Simulate loading
            </Button>
          </div>
          <CrudTable
            data={sortedRows}
            columns={showcaseColumns}
            sort={sort}
            onSortChange={setSort}
            rowActions={rowActions}
            bulkActions={bulkActions}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            isLoading={showLoading}
            emptyTitle="No showcase rows"
            onRowClick={(row) => toast.info(`Clicked: ${row.name}`)}
          />
          {selectedIds.length > 0 ? (
            <p className="text-xs text-muted-foreground">Selected: {selectedIds.join(', ')}</p>
          ) : null}
        </div>

        {/* AttachmentList */}
        <Card>
          <CardHeader><CardTitle>AttachmentList</CardTitle></CardHeader>
          <CardContent className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">With open + delete actions</p>
              <AttachmentList
                attachments={demoAttachments}
                isDeleting={deletingAttachment}
                onOpen={(att) => toast.info(`Opening ${att.name}`)}
                onDelete={(id) => {
                  setDeletingAttachment(id);
                  setTimeout(() => setDeletingAttachment(undefined), 1500);
                }}
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Read-only</p>
                <AttachmentList attachments={demoAttachments.slice(0, 2)} readOnly />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Empty state</p>
                <AttachmentList attachments={[]} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* StatCard + Timeline */}
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">StatCard — KPI metrics</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Active Clients" value="142" delta="+8 this month" trend="up" description="vs last month" />
              <StatCard label="Open Cases" value="37" delta="−5" trend="down" description="vs last week" />
              <StatCard label="Revenue (MTD)" value="€ 84,200" delta="+12%" trend="up" />
              <StatCard label="Overdue Tasks" value="9" delta="+3" trend="down" description="action required" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Timeline — audit trail / activity feed</p>
            <Timeline
              events={[
                { id: '1', label: 'Contract signed', timestamp: '2024-01-15 09:41', tone: 'success', description: 'Anna Hofer signed contract #12.' },
                { id: '2', label: 'Status changed to Active', timestamp: '2024-01-15 09:45', tone: 'info' },
                { id: '3', label: 'Note added', timestamp: '2024-02-03 14:22', description: 'Key strategic account. Renewal due Q1.' },
                { id: '4', label: 'Contract renewal warning', timestamp: '2024-12-20 08:00', tone: 'warning', description: 'Expires in 25 days.' },
              ] satisfies TimelineEvent[]}
            />
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════════
          § 7  NAVIGATION & OVERLAYS
          Breadcrumb · InlineEdit · Dialog · Tooltip · Separator · ScrollArea
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        id="nav"
        label="Navigation & Overlays"
        description="Dialog for forms and multi-step confirms. ConfirmPopover for inline lightweight confirms. Tooltip on all icon-only buttons."
      >

        <div className="grid gap-4 xl:grid-cols-2">
          {/* Breadcrumb + InlineEdit */}
          <Card>
            <CardHeader><CardTitle>Breadcrumb · InlineEdit</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Breadcrumb</p>
                <Breadcrumb items={[{ label: 'Clients', href: '/clients' }, { label: 'Apex Technologies', href: '/clients/cli_1001' }, { label: 'Contract #12' }]} />
                <Breadcrumb items={[{ label: 'Settings', href: '/settings' }, { label: 'Members' }]} />
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">InlineEdit — click to edit in-place</p>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Client name</p>
                  <InlineEdit value={inlineVal} onSave={(v) => { setInlineVal(v); toast.success('Name updated.'); }} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Disabled</p>
                  <InlineEdit value="Read-only value" onSave={() => undefined} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dialog */}
          <Card>
            <CardHeader><CardTitle>Dialog</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Use for forms, previews, and confirmations that need more space than a popover.
              </p>
              <Button variant="outline" onClick={() => setDialogOpen(true)}>Open Dialog</Button>
            </CardContent>
          </Card>
        </div>

        {/* Tooltip + Separator + ScrollArea */}
        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Tooltip</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">MouseTooltip follows the cursor (SE offset). Wrap any element — tooltip tracks the mouse.</p>
              <div className="flex flex-wrap gap-2">
                <MouseTooltip content={<p>Button tooltip</p>}>
                  <Button variant="outline" size="sm">Hover me</Button>
                </MouseTooltip>
                <MouseTooltip content={<p>Icon button tooltip</p>}>
                  <Button variant="ghost" size="icon"><InfoIcon size={16} /></Button>
                </MouseTooltip>
              </div>
              <MouseTooltip content={<div><p className="font-medium">Rich content</p><p className="mt-0.5 text-muted-foreground">Tooltip follows cursor</p></div>}>
                <div className="mt-3 inline-flex h-16 w-full cursor-default items-center justify-center rounded-control bg-muted/60 text-sm text-muted-foreground">
                  Hover anywhere here
                </div>
              </MouseTooltip>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Separator</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground">Above horizontal</p>
              <Separator />
              <p className="text-sm text-muted-foreground">Below horizontal</p>
              <div className="flex h-6 items-center gap-3">
                <span className="text-sm">Left</span>
                <Separator orientation="vertical" />
                <span className="text-sm">Right</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>ScrollArea</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-32 rounded-card border border-border/60">
                <div className="p-3 space-y-2">
                  {Array.from({ length: 12 }, (_, i) => (
                    <p key={i} className="text-sm text-muted-foreground">Scroll item {i + 1}</p>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════════
          § 8  PATTERNS
          Entity Overview Tab · Sub-entity management
      ══════════════════════════════════════════════════════════════════════════ */}
      <Section
        id="patterns"
        label="Patterns"
        description="Canonical page patterns. Reference these exact structures when building new modules."
      >

        {/* Entity Overview Tab */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Entity Overview Tab</p>
          <p className="text-xs text-muted-foreground">
            Complex entities lead with an Overview tab: stat row → recent activity → sub-entity summaries. Never put the full list on Overview — show top 3–5 with a "View all" link to the dedicated tab. This is shown without a Card wrapper — it lives directly inside a ModulePage.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Parties" value="4" icon={<InfoIcon size={16} />} />
            <StatCard label="Events" value="2" delta="+1 this week" trend="up" icon={<CheckCircle size={16} />} />
            <StatCard label="Documents" value="3" icon={<WarningIcon size={16} />} />
          </div>
          <SectionCard title="Recent Activity">
            <Timeline
              events={[
                { id: 'e1', label: 'Contract signed', timestamp: '2024-04-10T14:00:00Z', tone: 'success' },
                { id: 'e2', label: 'Document uploaded: death_certificate.docx', timestamp: '2024-04-02T09:30:00Z', tone: 'info' },
                { id: 'e3', label: 'Responsible changed to Anna Hofer', timestamp: '2024-03-30T11:00:00Z', tone: 'info' },
              ] satisfies TimelineEvent[]}
            />
          </SectionCard>
          <SectionCard title="Parties" actions={<Button size="sm" variant="outline"><PlusIcon size={14} className="mr-1.5" />Add</Button>}>
            <ListRow title="Anna Hofer" subtitle="Primary Contact · anna@apex.at" leading={<Avatar label="Anna Hofer" size="sm" />} />
            <ListRow title="Markus Leitner" subtitle="Billing Contact · markus@apex.at" leading={<Avatar label="Markus Leitner" size="sm" tone="accent" />} />
            <ListRow title="Pfarrkirche St. Stefan" subtitle="Parish" variant="muted" leading={<Avatar label="Pfarrkirche St. Stefan" size="sm" tone="muted" />} />
          </SectionCard>
        </div>

        {/* Sub-entity management */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Sub-entity Management — SectionCard + Dialog + EntityForm</p>
          <p className="text-xs text-muted-foreground">
            Standard pattern for managing sub-entities (parties, tasks, checklist items): SectionCard → ListRow per item → Dialog + EntityForm for add/edit. Never build custom modal markup per module.
          </p>
          <SectionCard
            title="Tasks"
            meta="2 open"
            actions={
              <Dialog>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Task</DialogTitle>
                    <DialogDescription>Create a new task linked to this record.</DialogDescription>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">EntityForm with task fields goes here.</p>
                  <DialogFooter>
                    <Button variant="default" onClick={() => toast.success('Task created.')}>Create</Button>
                  </DialogFooter>
                </DialogContent>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm"><PlusIcon size={14} /> Add</Button>
                </DialogTrigger>
              </Dialog>
            }
          >
            <ListRow
              title="Send condolence letter"
              subtitle="Due: 2024-04-15 · Anna Hofer"
              trailing={<StatusBadge status="Pending" />}
            />
            <ListRow
              title="File death certificate"
              subtitle="Due: 2024-04-20 · Markus Leitner"
              trailing={<StatusBadge status="Active" />}
            />
            <InlineEmptyState text="No further tasks." />
          </SectionCard>
        </div>
      </Section>

      {/* ── Hidden dialogs ───────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
            <DialogDescription>
              Use Dialog for forms, previews, and confirmations that need more space than a popover.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Dialog body content goes here.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="default" onClick={() => { setDialogOpen(false); toast.success('Saved.'); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Run destructive sample action?"
        description="Temporary shared confirmation pattern for troubleshooting and extraction-phase delete flows."
        confirmLabel="Confirm"
        confirmVariant="destructive"
        onConfirm={() => undefined}
      />

      {/* Token editor overlay — fixed position, renders on top of everything */}
      <TokenEditor />
    </ModulePage>
  );
}
