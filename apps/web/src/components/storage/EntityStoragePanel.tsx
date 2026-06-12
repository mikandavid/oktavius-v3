import {
  type Attachment,
  AttachmentList,
  Button,
  CollapsibleSection,
  formatDisplayDate,
  InlineEmptyState,
  SectionCard,
} from '@oktavius/base-ui';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import {
  StorageFileLinkPickerDialog,
  type StorageLinkNode,
} from '@/components/storage/StorageFileLinkPickerDialog';
import { DocumentIcon, LinkIcon, PlusIcon, UploadIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

export type EntityStorageFile = Attachment & {
  group: 'generated' | 'email' | 'images' | 'documents' | 'other';
};

const STORAGE_GROUP_LABELS: Record<EntityStorageFile['group'], string> = {
  generated: 'Generated documents',
  email: 'Emails',
  images: 'Images & scans',
  documents: 'Documents',
  other: 'Other files',
};

type EntityStoragePanelProps = {
  entityType: string;
  entityId: string;
  title?: string;
  files?: EntityStorageFile[];
  availableNodes?: StorageLinkNode[];
  readOnly?: boolean;
  className?: string;
};

function groupFiles(files: EntityStorageFile[]) {
  const grouped = new Map<EntityStorageFile['group'], EntityStorageFile[]>();
  for (const file of files) {
    grouped.set(file.group, [...(grouped.get(file.group) ?? []), file]);
  }
  return grouped;
}

function openStorageFile(attachment: Attachment) {
  if (!attachment.url) {
    appToast.info('File preview is not available.');
    return;
  }

  window.open(attachment.url, '_blank', 'noopener,noreferrer');
}

function storageGroupForNode(node: StorageLinkNode): EntityStorageFile['group'] {
  if (node.mimeType?.startsWith('image/')) return 'images';
  if (node.mimeType === 'application/pdf') return 'documents';
  return 'other';
}

function storageNodeToFile(node: StorageLinkNode): EntityStorageFile {
  return {
    id: node.id,
    name: node.name,
    size: node.fileSizeBytes,
    mimeType: node.mimeType,
    uploadedAt: node.updatedAt,
    uploadedBy: 'Storage library',
    group: storageGroupForNode(node),
    url: undefined,
  };
}

export function EntityStoragePanel({
  entityType,
  entityId,
  title = 'Files & attachments',
  files,
  availableNodes = [],
  readOnly = false,
  className,
}: EntityStoragePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localFiles, setLocalFiles] = useState<EntityStorageFile[]>(() => files ?? []);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [linkedNodeIds, setLinkedNodeIds] = useState<string[]>([]);

  const grouped = useMemo(() => groupFiles(localFiles), [localFiles]);
  const canLinkFromStorage = availableNodes.length > 0;

  useEffect(() => {
    if (files) setLocalFiles(files);
  }, [files]);

  const handleUpload = (fileList: FileList | null) => {
    if (!fileList?.length || readOnly) return;
    const uploaded = Array.from(fileList).map((file, index) => ({
      id: `stor_upload_${Date.now()}_${index}`,
      name: file.name,
      size: file.size,
      mimeType: file.type || undefined,
      uploadedAt: formatDisplayDate(new Date()),
      uploadedBy: 'You',
      group: file.type.startsWith('image/')
        ? ('images' as const)
        : file.type === 'application/pdf'
          ? ('documents' as const)
          : ('other' as const),
    }));
    setLocalFiles((current) => [...uploaded, ...current]);
    appToast.success(
      uploaded.length === 1 ? 'File uploaded.' : `${uploaded.length} files uploaded.`,
    );
  };

  const handleDelete = () => {
    if (!pendingDeleteId) return;
    setLocalFiles((current) => current.filter((file) => file.id !== pendingDeleteId));
    setPendingDeleteId(null);
    appToast.success('File removed.');
  };

  return (
    <>
      <SectionCard
        title={title}
        className={className}
        actions={
          readOnly ? undefined : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                <UploadIcon size={14} />
                Upload
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!canLinkFromStorage}
                onClick={() => {
                  if (!canLinkFromStorage) {
                    appToast.info('Storage source is not connected.');
                    return;
                  }
                  setLinkPickerOpen(true);
                }}
              >
                <LinkIcon size={14} />
                Link
              </Button>
            </div>
          )
        }
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            handleUpload(event.target.files);
            event.target.value = '';
          }}
        />

        {localFiles.length === 0 ? (
          <div className="space-y-3">
            <InlineEmptyState text="No files linked to this record yet." />
            {readOnly ? null : (
              <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                <PlusIcon size={14} />
                Upload file
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from(grouped.entries()).map(([group, groupFiles]) => (
              <CollapsibleSection
                key={group}
                defaultOpen
                variant="plain"
                title={
                  <span className="inline-flex items-center gap-2">
                    <DocumentIcon size={14} className="text-muted-foreground" />
                    {STORAGE_GROUP_LABELS[group]}
                  </span>
                }
                badge={<span className="text-xs text-muted-foreground">{groupFiles.length}</span>}
              >
                <AttachmentList
                  attachments={groupFiles}
                  readOnly={readOnly}
                  onDelete={readOnly ? undefined : (id) => setPendingDeleteId(id)}
                  onOpen={openStorageFile}
                />
              </CollapsibleSection>
            ))}
          </div>
        )}
      </SectionCard>

      <ConfirmActionDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        title="Remove file?"
        description="This removes the file link from this record."
        confirmLabel="Remove"
        confirmVariant="destructive"
        onConfirm={handleDelete}
      />

      <StorageFileLinkPickerDialog
        open={linkPickerOpen}
        onOpenChange={setLinkPickerOpen}
        entityType={entityType}
        entityId={entityId}
        nodes={availableNodes}
        linkedNodeIds={[...linkedNodeIds, ...localFiles.map((file) => file.id)]}
        onLinked={(nodeIds) => {
          const nodesById = new Map(availableNodes.map((node) => [node.id, node]));
          const nextFiles = nodeIds
            .map((nodeId) => nodesById.get(nodeId))
            .filter((node): node is StorageLinkNode => Boolean(node))
            .map(storageNodeToFile);
          if (nextFiles.length === 0) return;
          const validNodeIds = nextFiles.map((file) => file.id);
          setLinkedNodeIds((current) => [...new Set([...current, ...validNodeIds])]);
          setLocalFiles((current) => {
            const existingIds = new Set(current.map((file) => file.id));
            return [...nextFiles.filter((file) => !existingIds.has(file.id)), ...current];
          });
        }}
      />
    </>
  );
}
