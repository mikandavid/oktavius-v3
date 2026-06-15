import { cn, MouseTooltip } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { CheckIcon, EditIcon } from '@/lib/icons';

/**
 * Header action for the Modules section: toggles drag-to-reorder edit mode.
 * Renders nothing on the compact rail (reordering needs the expanded list).
 */
export function SidebarModuleOrderToggle({
  expanded,
  isEditing,
  onToggle,
}: {
  expanded: boolean;
  isEditing: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  if (!expanded) return null;

  const label = isEditing
    ? t('common.saveOrder', undefined, 'Save order')
    : t('common.editOrder', undefined, 'Edit order');

  return (
    <MouseTooltip content={label}>
      <button
        type="button"
        className={cn(
          'h-5 w-5 rounded-full text-sidebar-foreground/45 transition-opacity duration-150 hover:bg-sidebar-foreground/[0.05] hover:text-sidebar-foreground',
          !isEditing &&
            'pointer-events-none opacity-0 group-hover/module-header:pointer-events-auto group-hover/module-header:opacity-100',
        )}
        onClick={onToggle}
        aria-label={label}
      >
        {isEditing ? (
          <CheckIcon size={12} className="mx-auto" />
        ) : (
          <EditIcon size={12} className="mx-auto" />
        )}
      </button>
    </MouseTooltip>
  );
}
