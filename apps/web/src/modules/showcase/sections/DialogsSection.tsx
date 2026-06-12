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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oktavius/base-ui';
import { useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DialogFormFooter } from '@/components/common/DialogFormFooter';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import { BulkImportWizard } from '@/components/data/BulkImportWizard';
import { ShortcutHelpDialog } from '@/components/layout/ShortcutHelpDialog';
import { ApproveRejectDialog } from '@/components/workflow/ApproveRejectDialog';
import { DeleteIcon, EditIcon, MoreIcon, PlusIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => appToast.success('Deleted.')}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <ConfirmPopover
            title="Remove line item?"
            description="This cannot be undone."
            confirmLabel="Remove"
            onConfirm={() => appToast.success('Line item removed.')}
            trigger={
              <Button size="sm" variant="outline">
                ConfirmPopover
              </Button>
            }
          />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Drawer"
        meta="Radix Dialog slide-in — mobile nav, filters, bottom sheets"
      >
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button size="sm" variant="outline">
              Open bottom drawer
            </Button>
          </DrawerTrigger>
          <DrawerContent side="bottom" className="max-w-lg mx-auto">
            <DrawerHeader className="text-left">
              <DrawerTitle>Filter cases</DrawerTitle>
              <DrawerDescription>
                Bottom sheets for mobile filters and quick actions — no extra dependencies.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 text-sm text-muted-foreground">
              Use <code className="text-foreground">side=&quot;left&quot;</code> for navigation
              rails (see mobile app shell).
            </div>
          </DrawerContent>
        </Drawer>
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
                  appToast.success('Assigned.');
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
            Bulk import
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
            <DropdownMenuItem onClick={() => appToast.info('Edit clicked.')}>
              <EditIcon size={14} className="mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => appToast.error('Delete clicked.')}
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
        onConfirm={() => appToast.success('Record deleted.')}
      />

      <SubEntityFormDialog
        open={subEntityOpen}
        onOpenChange={setSubEntityOpen}
        title="Add contact"
        fields={SUB_ENTITY_FIELDS}
        defaultValues={{ name: '', role: 'primary_contact' }}
        submitLabel="Add contact"
        onSubmit={() => {
          appToast.success('Contact added.');
        }}
      />

      <ApproveRejectDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        action="approve"
        title="PO SO-2024-1101"
        description="Approve this purchase order for €15,800?"
        onConfirm={() => appToast.success('Approved.')}
      />

      <ApproveRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        action="reject"
        title="PO SO-2024-1101"
        commentRequired
        onConfirm={() => appToast.success('Rejected.')}
      />

      <BulkImportWizard open={importOpen} onOpenChange={setImportOpen} entityLabel="clients" />

      <ShowcaseBlock title="ShortcutHelpDialog" meta="Keyboard shortcut reference">
        <Button size="sm" variant="outline" onClick={() => setShortcutsOpen(true)}>
          Open shortcut help
        </Button>
        <ShortcutHelpDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      </ShowcaseBlock>
    </div>
  );
}
