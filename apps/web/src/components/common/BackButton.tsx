import { Link, useNavigate } from 'react-router-dom';

import { Button, buttonVariants, cn } from '@oktavius/base-ui';
import { BackIcon } from '@/lib/icons';

type BackButtonProps = {
  to?: string;
  label: string;
  className?: string;
};

export function BackButton({ to, label, className }: BackButtonProps) {
  const navigate = useNavigate();

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'h-8 px-2 text-muted-foreground hover:text-foreground',
          className,
        )}
      >
        <BackIcon size={16} weight="bold" />
        {label}
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('h-8 px-2 text-muted-foreground hover:text-foreground', className)}
      onClick={() => navigate(-1)}
    >
      <BackIcon size={16} weight="bold" />
      {label}
    </Button>
  );
}
