export type SupportCategory = 'bug' | 'feature_request' | 'other';
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SupportSource = 'web' | 'agent' | 'email';

export type SupportAutomationStatus =
  | 'not_requested'
  | 'queued'
  | 'pr_created'
  | 'needs_input'
  | 'no_changes'
  | 'failed';

export type SupportTicket = {
  id: string;
  orgId: string | null;
  orgName: string | null;
  userId: string;
  userEmail: string;
  userName: string | null;
  subject: string;
  message: string;
  category: SupportCategory;
  status: SupportStatus;
  priority: SupportPriority;
  tags: string[];
  source: SupportSource;
  resolutionMessage: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  assigneeUserId: string | null;
  assigneeName: string | null;
  automationStatus: SupportAutomationStatus | null;
  automationPrUrl: string | null;
  automationBranchName: string | null;
  automationWorkflowRunUrl: string | null;
  automationError: string | null;
  currentPageUrl: string | null;
  agentConversationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface SupportComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  message: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportAssignee {
  userId: string;
  name: string;
  email: string;
}

export interface SupportStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface ListTicketsParams {
  page?: number;
  pageSize?: number;
  status?: SupportStatus;
  priority?: SupportPriority;
  category?: SupportCategory;
  search?: string;
  sort?: string;
  tag?: string;
}

export interface TicketListResult {
  data: SupportTicket[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateTicketInput {
  subject: string;
  message: string;
  category: SupportCategory;
  priority?: SupportPriority;
  tags?: string[];
  currentPageUrl?: string;
}

// Attachment nodes mirror the StorageNode shape but are scoped to the support module
// to comply with no-cross-module-imports. Keep in sync with storage/data/types.ts.
export type SupportAttachmentNodeType = 'folder' | 'file';
export type SupportAttachmentUploadStatus = 'pending' | 'uploading' | 'ready' | 'failed';

export interface SupportAttachment {
  id: string;
  parentId: string | null;
  nodeType: SupportAttachmentNodeType;
  name: string;
  mimeType: string | null;
  fileExtension: string | null;
  fileSizeBytes: number | null;
  uploadStatus: SupportAttachmentUploadStatus;
  trashedAt: string | null;
  purgeAfterAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
