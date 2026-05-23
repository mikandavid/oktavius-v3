import { Link, useNavigate } from 'react-router-dom';

import { Button, buttonVariants, cn } from '@oktavius/base-ui';
import { BackIcon } from '@/lib/icons';

type BackButtonProps = {
  to?: string;
  /** Accessible label — not shown visually */
  label?: string;
  className?: string;
};

export function BackButton({ to, label = 'Back', className }: BackButtonProps) {
  const navigate = useNavigate();
  const buttonClass = cn(
    buttonVariants({ variant: 'ghost', size: 'icon' }),
    'h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground',
    className,
  );

  if (to) {
    return (
      <Link to={to} className={buttonClass} aria-label={label}>
        <BackIcon size={16} weight="bold" />
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground', className)}
      aria-label={label}
      onClick={() => navigate(-1)}
    >
      <BackIcon size={16} weight="bold" />
    </Button>
  );
}
