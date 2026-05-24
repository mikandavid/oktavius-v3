import { Link } from 'react-router-dom';

import { Button, buttonVariants, cn } from '@oktavius/base-ui';
import { DeleteIcon, EditIcon } from '@/lib/icons';

import { PAGE_HEADER_ICON_BUTTON_CLASS } from './PageHeaderButtons';

const iconButtonClass = PAGE_HEADER_ICON_BUTTON_CLASS;

type IconEditButtonProps = {
  to?: string;
  onClick?: () => void;
  /** Accessible label — not shown visually */
  label?: string;
  className?: string;
};

export function IconEditButton({ to, onClick, label = 'Edit', className }: IconEditButtonProps) {
  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          iconButtonClass,
          className,
        )}
        aria-label={label}
      >
        <EditIcon size={14} />
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(iconButtonClass, className)}
      aria-label={label}
      onClick={onClick}
    >
      <EditIcon size={14} />
    </Button>
  );
}

type IconDeleteButtonProps = {
  onClick: () => void;
  /** Accessible label — not shown visually */
  label?: string;
  className?: string;
};

export function IconDeleteButton({ onClick, label = 'Delete', className }: IconDeleteButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(iconButtonClass, className)}
      aria-label={label}
      onClick={onClick}
    >
      <DeleteIcon size={14} />
    </Button>
  );
}
