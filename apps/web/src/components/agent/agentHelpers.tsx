import { formatBytes } from '@/lib/formatBytes';
import type { PhosphorIcon } from '@/lib/icons';
import {
  DocumentIcon,
  EditIcon,
  EyeIcon,
  ForwardIcon,
  GlobeIcon,
  LinkIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  SuccessIcon,
  TableIcon,
  TerminalIcon,
  TimeIcon,
  BrainIcon,
} from '@/lib/icons';

export const DEFAULT_CONTEXT_WINDOW_TOKENS = 200_000;

const VERB_LABELS: Record<string, string> = {
  create: 'Creating',
  list: 'Listing',
  show: 'Getting',
  get: 'Getting',
  read: 'Getting',
  update: 'Updating',
  edit: 'Updating',
  delete: 'Deleting',
  search: 'Searching',
  send: 'Sending',
  convert: 'Converting',
  record: 'Recording',
  approve: 'Approving',
  log: 'Logging',
  link: 'Linking',
  count: 'Counting',
  add: 'Adding',
  optimize: 'Optimizing',
  plan: 'Planning',
  process: 'Processing',
};

export type IconComponent = PhosphorIcon;

export function formatToolName(toolName: string): string {
  const parts = toolName.split('_').filter(Boolean);
  if (parts.length === 0) return toolName;
  const verb = parts[0].toLowerCase();
  const rest = parts
    .slice(1)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
  const label = VERB_LABELS[verb] ?? verb.charAt(0).toUpperCase() + verb.slice(1).toLowerCase();
  return rest ? `${label} ${rest}` : label;
}

export function getToolIcon(toolName: string): IconComponent {
  const lower = toolName.toLowerCase();
  const first = lower.split('_')[0];
  if (lower === 'python_execute') return TerminalIcon;
  if (lower.startsWith('memory_')) return BrainIcon;
  if (lower === 'web_search' || lower === 'web_fetch') return GlobeIcon;
  if (lower.includes('optimize') || lower.includes('plan_workday')) return ForwardIcon;
  if (lower.startsWith('process')) return TimeIcon;
  switch (first) {
    case 'create':
    case 'add':
      return PlusIcon;
    case 'list':
    case 'count':
      return ListIcon;
    case 'search':
      return SearchIcon;
    case 'show':
    case 'get':
    case 'read':
      return EyeIcon;
    case 'update':
    case 'edit':
      return EditIcon;
    case 'delete':
      return SuccessIcon;
    case 'send':
      return ForwardIcon;
    case 'convert':
      return ForwardIcon;
    case 'record':
    case 'approve':
      return SuccessIcon;
    case 'log':
      return TimeIcon;
    case 'link':
      return LinkIcon;
    default:
      return SuccessIcon;
  }
}

export function formatTokenCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

export function formatFileSize(bytes: number): string {
  return formatBytes(bytes);
}

export function getAttachmentIcon(fileName: string, mimeType: string): IconComponent {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return DocumentIcon;
  if (['xlsx', 'xls', 'xlsm', 'csv', 'tsv'].includes(ext)) return TableIcon;
  if (
    mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'].includes(ext)
  ) {
    return EyeIcon;
  }
  return DocumentIcon;
}
