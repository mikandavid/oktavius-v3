import {
  Badge,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  InlineEmptyState,
  Input,
  ScrollArea,
} from '@oktavius/base-ui';
import { useEffect, useMemo, useState } from 'react';

import { DialogFormFooter } from '@/components/common/DialogFormFooter';
import { formatBytes } from '@/lib/formatBytes';
import { appToast } from '@/lib/toast';

export type StorageLinkNode = {
  id: string;
  name: string;
  fileSizeBytes: number;
  mimeType?: string;
  uploadStatus: 'ready' | 'processing' | 'failed';
  updatedAt: string;
};

export type StorageFileLinkPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
  linkedNodeIds: string[];
  nodes?: StorageLinkNode[];
  onLinked?: (nodeIds: string[]) => void | Promise<void>;
};

function searchStorageNodes(nodes: StorageLinkNode[], query: string): StorageLinkNode[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return nodes;
  return nodes.filter((node) => node.name.toLowerCase().includes(normalized));
}

export function StorageFileLinkPickerDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  linkedNodeIds,
  nodes: availableNodes = [],
  onLinked,
}: StorageFileLinkPickerDialogProps) {
  void entityType;
  void entityId;

  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [linking, setLinking] = useState(false);

  const linkedSet = useMemo(() => new Set(linkedNodeIds), [linkedNodeIds]);
  const nodes = useMemo(() => searchStorageNodes(availableNodes, query), [availableNodes, query]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const newLinkCount = useMemo(
    () => selectedIds.filter((id) => !linkedSet.has(id)).length,
    [linkedSet, selectedIds],
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIds([]);
    }
  }, [open]);

  const handleConfirm = async () => {
    const toLink = selectedIds.filter((id) => !linkedSet.has(id));
    if (toLink.length === 0) return;
    setLinking(true);
    try {
      await onLinked?.(toLink);
      appToast.success(toLink.length === 1 ? 'File linked.' : `${toLink.length} files linked.`);
      onOpenChange(false);
    } catch {
      appToast.error('Could not link selected files.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Link from storage</DialogTitle>
          <DialogDescription>
            Browse the global file library and attach files to this record.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search files by name…"
        />

        <div className="rounded-card border border-border/50">
          <ScrollArea className="h-[320px]">
            <div className="divide-y">
              {nodes.length === 0 ? (
                <InlineEmptyState text="No files match your search." centered />
              ) : (
                nodes.map((node: StorageLinkNode) => {
                  const alreadyLinked = linkedSet.has(node.id);
                  const notReady = node.uploadStatus !== 'ready';
                  const disabledPick = alreadyLinked || notReady;
                  const isChecked = selectedIdSet.has(node.id);

                  return (
                    <label key={node.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                      <Checkbox
                        checked={alreadyLinked || isChecked}
                        disabled={disabledPick}
                        onCheckedChange={(checked) => {
                          setSelectedIds((previous) => {
                            if (checked === true) {
                              return previous.includes(node.id) ? previous : [...previous, node.id];
                            }
                            return previous.filter((id) => id !== node.id);
                          });
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium">{node.name}</span>
                          {alreadyLinked ? <Badge variant="secondary">Already linked</Badge> : null}
                          {notReady && !alreadyLinked ? (
                            <Badge variant="outline">Not ready</Badge>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatBytes(node.fileSizeBytes)}
                          {node.mimeType ? ` · ${node.mimeType}` : ''}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFormFooter
          cancelLabel="Cancel"
          onCancel={() => onOpenChange(false)}
          confirmLabel={
            newLinkCount > 0
              ? `Link ${newLinkCount} file${newLinkCount === 1 ? '' : 's'}`
              : 'Link selected'
          }
          confirmDisabled={newLinkCount === 0}
          confirmLoading={linking}
          onConfirm={() => void handleConfirm()}
        />
      </DialogContent>
    </Dialog>
  );
}
