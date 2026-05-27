import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  ConfirmPopover,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oktavius/base-ui';

import { BulkImportDialog } from '@/components/data/BulkImportDialog';
import { BulkImportWizard } from '@/components/data/BulkImportWizard';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DialogFormFooter } from '@/components/common/DialogFormFooter';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import { ApproveRejectDialog } from '@/components/workflow/ApproveRejectDialog';
import { ShortcutHelpDialog } from '@/components/layout/ShortcutHelpDialog';
import { DeleteIcon, EditIcon, MoreIcon, PlusIcon } from '@/lib/icons';
import { toast } from '@/lib/toast';

import { ShowcaseBlock } from '../shared';

const SUB_ENTITY_FIELDS = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'role', label: 'Role', type: 'text' as const },
];

export function DialogsSection() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [subEntityOpen, setSubEntityOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <ShowcaseBlock
        title="Confirm dialogs"
        meta="ConfirmActionDialog · AlertDialog · ConfirmPopover"
      >
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setConfirmOpen(true)}>
            ConfirmActionDialog
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline">
                AlertDialog
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All related data will be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => toast.success('Deleted.')}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <ConfirmPopover
            title="Remove line item?"
            description="This cannot be undone."
            confirmLabel="Remove"
            onConfirm={() => toast.success('Line item removed.')}
            trigger={
              <Button size="sm" variant="outline">
                ConfirmPopover
              </Button>
            }
          />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Form dialogs"
        meta="SubEntityFormDialog · DialogFormFooter · EntityForm surface=dialog"
      >
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="cta" onClick={() => setSubEntityOpen(true)}>
            <PlusIcon size={14} />
            SubEntityFormDialog
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                Custom dialog footer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Confirm assignment</DialogTitle>
                <DialogDescription>Assign this case to Markus Leitner?</DialogDescription>
              </DialogHeader>
              <DialogFormFooter
                confirmLabel="Assign"
                onConfirm={() => {
                  toast.success('Assigned.');
                  setDialogOpen(false);
                }}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="Workflow dialogs" meta="ApproveRejectDialog with optional comment">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setApproveOpen(true)}>
            Approve flow
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)}>
            Reject flow
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            Bulk import wizard
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)}>
            Bulk import dialog
          </Button>
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="Dropdown menu" meta="Row actions · kebab menus">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Row actions">
              <MoreIcon size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast.info('Edit clicked.')}>
              <EditIcon size={14} className="mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => toast.error('Delete clicked.')}
            >
              <DeleteIcon size={14} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ShowcaseBlock>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this record?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => toast.success('Record deleted.')}
      />

      <SubEntityFormDialog
        open={subEntityOpen}
        onOpenChange={setSubEntityOpen}
        title="Add contact"
        fields={SUB_ENTITY_FIELDS}
        defaultValues={{ name: '', role: 'primary_contact' }}
        submitLabel="Add contact"
        onSubmit={() => {
          toast.success('Contact added.');
        }}
      />

      <ApproveRejectDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        action="approve"
        title="PO SO-2024-1101"
        description="Approve this purchase order for €15,800?"
        onConfirm={() => toast.success('Approved.')}
      />

      <ApproveRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        action="reject"
        title="PO SO-2024-1101"
        commentRequired
        onConfirm={() => toast.success('Rejected.')}
      />

      <BulkImportWizard open={importOpen} onOpenChange={setImportOpen} entityLabel="clients" />
      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        entityLabel="clients"
      />

      <ShowcaseBlock title="ShortcutHelpDialog" meta="Keyboard shortcut reference">
        <Button size="sm" variant="outline" onClick={() => setShortcutsOpen(true)}>
          Open shortcut help
        </Button>
        <ShortcutHelpDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      </ShowcaseBlock>
    </div>
  );
}
