/**
 * Central icon registry for OktaviusV3.
 *
 * All icons come from @phosphor-icons/react. Import from here, not directly
 * from the library, so the icon set stays auditable and consistent.
 *
 * Usage:
 *   import { PlusIcon, UserIcon } from '@/lib/icons';
 *   import { icons } from '@/lib/icons'; // named map for nav / dynamic use
 */

export type { Icon as PhosphorIcon, IconProps } from '@phosphor-icons/react';

// ─── Navigation & Structure ──────────────────────────────────────────────────
export {
  House as HomeIcon,
  Users as UsersIcon,
  Gear as SettingsIcon,
  ChartBar as ReportsIcon,
  Buildings as OrganizationIcon,
  Shield as SuperadminIcon,
  Briefcase as ProjectsIcon,
  ClipboardText as TasksIcon,
  Calendar as CalendarIcon,
  FileText as DocumentIcon,
  Folder as FolderIcon,
  ShoppingCart as OrderIcon,
  Receipt as InvoiceIcon,
  Package as ProductIcon,
  Kanban as ProjectIcon,
  Scales as CaseIcon,
  Siren as IncidentIcon,
  Scroll as ContractIcon,
  Bell as NotificationsIcon,
  MagnifyingGlass as SearchIcon,
  Robot as BotIcon,
  SidebarSimple as SidebarIcon,
  ClockCounterClockwise as HistoryIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  DotsSixVertical as DragHandleIcon,
  ArrowsOutLineHorizontal as FullWidthIcon,
  ArrowsInLineHorizontal as HalfWidthIcon,
  Sidebar as PanelLeftIcon,
  SidebarSimple as PanelLeftCloseIcon,
} from '@phosphor-icons/react';

// ─── Actions ─────────────────────────────────────────────────────────────────
export {
  Plus as PlusIcon,
  PencilSimple as EditIcon,
  Trash as DeleteIcon,
  Paperclip as PaperclipIcon,
  ArrowLeft as BackIcon,
  ArrowRight as ForwardIcon,
  ArrowsClockwise as RefreshIcon,
  DownloadSimple as DownloadIcon,
  UploadSimple as UploadIcon,
  PaperPlaneTilt as SendIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
  X as CloseIcon,
  DotsThree as MoreIcon,
  CaretDown as ChevronDownIcon,
  CaretUp as ChevronUpIcon,
  CaretLeft as ChevronLeftIcon,
  CaretRight as ChevronRightIcon,
  ArrowsDownUp as SortIcon,
  ArrowUp as SortAscIcon,
  ArrowDown as SortDescIcon,
  Funnel as FilterIcon,
  Export as ExportIcon,
  GearSix as Settings2Icon,
} from '@phosphor-icons/react';

// ─── Status & Feedback ───────────────────────────────────────────────────────
export {
  CheckCircle as SuccessIcon,
  XCircle as ErrorIcon,
  WarningCircle as WarningIcon,
  Info as InfoIcon,
  SpinnerGap as SpinnerIcon,
  CircleDashed as EmptyIcon,
  Tray as EmptyStateIcon,
} from '@phosphor-icons/react';

// ─── Users & Identity ────────────────────────────────────────────────────────
export {
  User as UserIcon,
  UserCircle as UserCircleIcon,
  UserPlus as UserAddIcon,
  UserMinus as UserRemoveIcon,
  UsersThree as TeamIcon,
  IdentificationCard as IdCardIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
} from '@phosphor-icons/react';

// ─── Data & Content ──────────────────────────────────────────────────────────
export {
  Table as TableIcon,
  ListBullets as ListIcon,
  SquaresFour as GridIcon,
  Tag as TagIcon,
  Hash as HashIcon,
  CurrencyDollar as MoneyIcon,
  Percent as PercentIcon,
  Link as LinkIcon,
  At as EmailIcon,
  Phone as PhoneIcon,
  MapPin as LocationIcon,
  Globe as WebIcon,
  Globe as GlobeIcon,
  MapTrifold as MapIcon,
  ArrowSquareOut as ExternalLinkIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Desktop as SystemThemeIcon,
  SignOut as SignOutIcon,
} from '@phosphor-icons/react';

// ─── Form & Input ────────────────────────────────────────────────────────────
export {
  Eye as EyeIcon,
  EyeSlash as EyeOffIcon,
  MagnifyingGlass as InputSearchIcon,
  Clock as TimeIcon,
  Microphone as MicIcon,
  Minus as MinusIcon,
  Equals as EqualsIcon,
  Stop as StopIcon,
  Brain as BrainIcon,
  TerminalWindow as TerminalIcon,
  ChatCircle as MessageSquareIcon,
  Lightning as ZapIcon,
  ArrowRight as ArrowRightIcon,
  ArrowsLeftRight as ArrowRightLeftIcon,
  Square as SquareIcon,
  ArrowUp as ArrowUpIcon,
  Table as FileSpreadsheetIcon,
  Image as ImageIcon,
} from '@phosphor-icons/react';

// ─── Dynamic icon registry (for nav config, module manifests, etc.) ──────────
import type { Icon as PhosphorIconType } from '@phosphor-icons/react';
import {
  House,
  Users,
  Gear,
  ChartBar,
  Buildings,
  Briefcase,
  ClipboardText,
  Calendar,
  FileText,
  Folder,
  Bell,
  User,
  UsersThree,
  Lock,
  Globe,
  Tag,
  CurrencyDollar,
  Table,
  CheckCircle,
} from '@phosphor-icons/react';

export const icons = {
  House,
  Users,
  Gear,
  ChartBar,
  Buildings,
  Briefcase,
  ClipboardText,
  Calendar,
  FileText,
  Folder,
  Bell,
  User,
  UsersThree,
  Lock,
  Globe,
  Tag,
  CurrencyDollar,
  Table,
  CheckCircle,
} as const satisfies Record<string, PhosphorIconType>;

export type IconName = keyof typeof icons;
