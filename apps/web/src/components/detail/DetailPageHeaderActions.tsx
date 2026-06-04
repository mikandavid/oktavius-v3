import { useDemoData } from '@/app/demo-data';
import { IconDeleteButton, IconEditButton } from '@/components/common/RecordIconButtons';
import { canDeleteRecords, permissionSubjectFor } from '@/lib/permissions';

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
  const { activeMembership, currentUser } = useDemoData();
  const canDelete = canDeleteRecords(permissionSubjectFor(currentUser, activeMembership));

  return (
    <div className="flex items-center gap-2">
      <DetailActions actions={customActions} />
      {editTo || onEdit ? <IconEditButton to={editTo} onClick={onEdit} label={editLabel} /> : null}
      {canDelete ? <IconDeleteButton onClick={onDelete} label={deleteLabel} /> : null}
    </div>
  );
}
