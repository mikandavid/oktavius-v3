import { IconDeleteButton, IconEditButton } from '@/components/common/RecordIconButtons';
import { canDeleteRecords, EMPTY_PERMISSION_SUBJECT } from '@/lib/permissions';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { DetailActions, type DetailAction } from './DetailActions';

type DetailPageHeaderActionsProps = {
  customActions?: DetailAction[];
  editTo?: string;
  onEdit?: () => void;
  editLabel?: string;
  onDelete: () => void;
  deleteLabel?: string;
};

/** Icon-only edit + delete actions for entity detail page headers. */
export function DetailPageHeaderActions({
  customActions,
  editTo,
  onEdit,
  editLabel = 'Edit',
  onDelete,
  deleteLabel = 'Delete',
}: DetailPageHeaderActionsProps) {
  const osirisRuntime = useOptionalOsirisRuntime();
  const permissionSubject = osirisRuntime?.permissionSubject ?? EMPTY_PERMISSION_SUBJECT;
  const canDelete = canDeleteRecords(permissionSubject);

  return (
    <div className="flex items-center gap-2">
      <DetailActions actions={customActions} />
      {editTo || onEdit ? <IconEditButton to={editTo} onClick={onEdit} label={editLabel} /> : null}
      {canDelete ? <IconDeleteButton onClick={onDelete} label={deleteLabel} /> : null}
    </div>
  );
}
