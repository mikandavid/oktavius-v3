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

export type { IconProps, Icon as PhosphorIcon } from '@phosphor-icons/react';

// ─── Navigation & Structure ──────────────────────────────────────────────────
export {
  Robot as BotIcon,
  Calendar as CalendarIcon,
  Scales as CaseIcon,
  Scroll as ContractIcon,
  FileText as DocumentIcon,
  DotsSixVertical as DragHandleIcon,
  Folder as FolderIcon,
  ArrowsOutLineHorizontal as FullWidthIcon,
  ArrowsInLineHorizontal as HalfWidthIcon,
  ClockCounterClockwise as HistoryIcon,
  House as HomeIcon,
  Siren as IncidentIcon,
  Receipt as InvoiceIcon,
  Bell as NotificationsIcon,
  ShoppingCart as OrderIcon,
  Buildings as OrganizationIcon,
  SidebarSimple as PanelLeftCloseIcon,
  Sidebar as PanelLeftIcon,
  Package as ProductIcon,
  Kanban as ProjectIcon,
  Briefcase as ProjectsIcon,
  ChartBar as ReportsIcon,
  MagnifyingGlass as SearchIcon,
  Gear as SettingsIcon,
  SidebarSimple as SidebarIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  Shield as SuperadminIcon,
  ClipboardText as TasksIcon,
  Users as UsersIcon,
} from '@phosphor-icons/react';

// ─── Actions ─────────────────────────────────────────────────────────────────
export {
  Archive as ArchiveIcon,
  ArrowLeft as BackIcon,
  Check as CheckIcon,
  CaretDown as ChevronDownIcon,
  CaretLeft as ChevronLeftIcon,
  CaretRight as ChevronRightIcon,
  CaretUp as ChevronUpIcon,
  X as CloseIcon,
  Copy as CopyIcon,
  Trash as DeleteIcon,
  DownloadSimple as DownloadIcon,
  PencilSimple as EditIcon,
  ArrowBendUpRight as EmailForwardIcon,
  Export as ExportIcon,
  Funnel as FilterIcon,
  Flag as FlagIcon,
  ArrowRight as ForwardIcon,
  Funnel as FunnelIcon,
  EnvelopeOpen as MarkReadIcon,
  Envelope as MarkUnreadIcon,
  Minus as MinimizeIcon,
  DotsThree as MoreIcon,
  FolderSimple as MoveToFolderIcon,
  Paperclip as PaperclipIcon,
  Plus as PlusIcon,
  Printer as PrintIcon,
  Bag as PurchasingIcon,
  ArrowsClockwise as RefreshIcon,
  ArrowBendDoubleUpLeft as ReplyAllIcon,
  ArrowBendUpLeft as ReplyIcon,
  PaperPlaneTilt as SendIcon,
  GearSix as Settings2Icon,
  ArrowUp as SortAscIcon,
  ArrowDown as SortDescIcon,
  ArrowsDownUp as SortIcon,
  Star as StarIcon,
  Files as TemplatesIcon,
  UploadSimple as UploadIcon,
} from '@phosphor-icons/react';

// ─── Status & Feedback ───────────────────────────────────────────────────────
export {
  CircleDashed as EmptyIcon,
  Tray as EmptyStateIcon,
  XCircle as ErrorIcon,
  Info as InfoIcon,
  SpinnerGap as SpinnerIcon,
  CheckCircle as SuccessIcon,
  WarningCircle as WarningIcon,
} from '@phosphor-icons/react';

// ─── Users & Identity ────────────────────────────────────────────────────────
export {
  IdentificationCard as IdCardIcon,
  Lock as LockIcon,
  UsersThree as TeamIcon,
  LockOpen as UnlockIcon,
  UserPlus as UserAddIcon,
  UserCircle as UserCircleIcon,
  User as UserIcon,
  UserMinus as UserRemoveIcon,
} from '@phosphor-icons/react';

// ─── Data & Content ──────────────────────────────────────────────────────────
export {
  At as EmailIcon,
  ArrowSquareOut as ExternalLinkIcon,
  Globe as GlobeIcon,
  SquaresFour as GridIcon,
  Hash as HashIcon,
  Link as LinkIcon,
  ListBullets as ListIcon,
  MapPin as LocationIcon,
  MapTrifold as MapIcon,
  CurrencyDollar as MoneyIcon,
  Moon as MoonIcon,
  Percent as PercentIcon,
  Phone as PhoneIcon,
  SignOut as SignOutIcon,
  Sun as SunIcon,
  Desktop as SystemThemeIcon,
  Table as TableIcon,
  Tag as TagIcon,
  Globe as WebIcon,
} from '@phosphor-icons/react';

// ─── Form & Input ────────────────────────────────────────────────────────────
export {
  ArrowRight as ArrowRightIcon,
  ArrowsLeftRight as ArrowRightLeftIcon,
  ArrowUp as ArrowUpIcon,
  BookOpen as BookOpenIcon,
  Brain as BrainIcon,
  Equals as EqualsIcon,
  Eye as EyeIcon,
  EyeSlash as EyeOffIcon,
  Table as FileSpreadsheetIcon,
  Image as ImageIcon,
  MagnifyingGlass as InputSearchIcon,
  ChatCircle as MessageSquareIcon,
  Microphone as MicIcon,
  Minus as MinusIcon,
  Pause as PauseIcon,
  Play as PlayIcon,
  Square as SquareIcon,
  Stop as StopIcon,
  TerminalWindow as TerminalIcon,
  Clock as TimeIcon,
  Lightning as ZapIcon,
} from '@phosphor-icons/react';

// ─── Dynamic icon registry (for nav config, module manifests, etc.) ──────────
import type { Icon as PhosphorIconType } from '@phosphor-icons/react';
import {
  Bell,
  Briefcase,
  Buildings,
  Calendar,
  ChartBar,
  CheckCircle,
  ClipboardText,
  CurrencyDollar,
  FileText,
  Folder,
  Gear,
  Globe,
  House,
  Lock,
  Table,
  Tag,
  User,
  Users,
  UsersThree,
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
