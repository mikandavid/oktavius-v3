import { Badge, cn } from '@oktavius/base-ui';
import { Link } from 'react-router-dom';

import { ExternalLinkIcon } from '@/lib/icons';

type LinkedEntityPillProps = {
  label: string;
  href: string;
  className?: string;
};

export function LinkedEntityPill({ label, href, className }: LinkedEntityPillProps) {
  return (
    <Link to={href} className={cn('inline-flex', className)}>
      <Badge variant="secondary" className="gap-1">
        {label}
        <ExternalLinkIcon size={12} />
      </Badge>
    </Link>
  );
}
