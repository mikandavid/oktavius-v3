import { cn } from '@oktavius/base-ui';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

import { BrandMark } from './BrandMark';
import { useSidebarFlyout } from './SidebarFlyout';
import { labelFadeClass, ORG_HOME_PATH } from './sidebarNav';
import { SidebarNavPill } from './SidebarNavPill';

export function SidebarBrand({
  expanded,
  labelsVisible,
  title,
  logoUrl,
  isActive,
  onNavigate,
}: {
  expanded: boolean;
  labelsVisible: boolean;
  title: string;
  logoUrl: string | null;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const brandRowRef = useRef<HTMLDivElement>(null);
  const brandFlyout = useSidebarFlyout('brand');

  if (expanded) {
    return (
      <Link
        to={ORG_HOME_PATH}
        onClick={onNavigate}
        className={cn(
          'flex h-12 w-full shrink-0 items-center gap-2 px-3 transition-colors duration-150 hover:bg-sidebar-foreground/[0.05] active:bg-sidebar-foreground/[0.08]',
        )}
      >
        <BrandMark logoUrl={logoUrl} />
        <span
          className={cn(
            'truncate text-sm font-semibold text-sidebar-foreground transition-opacity duration-150',
            labelFadeClass(labelsVisible),
          )}
        >
          {title}
        </span>
      </Link>
    );
  }

  return (
    <div
      ref={brandRowRef}
      className={cn('relative flex h-12 w-full shrink-0 items-center justify-center')}
      onMouseEnter={brandFlyout.show}
      onMouseLeave={brandFlyout.hide}
    >
      <Link
        to={ORG_HOME_PATH}
        onClick={onNavigate}
        aria-label={title}
        className={cn(
          'mx-auto flex h-9 w-9 items-center justify-center rounded-full',
          (brandFlyout.open || isActive) && 'bg-sidebar-primary/10',
          !brandFlyout.open && !isActive && 'hover:bg-sidebar-foreground/[0.05]',
        )}
      >
        <BrandMark logoUrl={logoUrl} />
      </Link>
      <SidebarNavPill
        anchorRef={brandRowRef}
        open={brandFlyout.open}
        label={title}
        isActive={isActive}
        href={ORG_HOME_PATH}
        onNavigate={onNavigate}
        onPointerEnter={brandFlyout.show}
        onPointerLeave={brandFlyout.hide}
      />
    </div>
  );
}
