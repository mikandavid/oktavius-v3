import { cn } from '@oktavius/base-ui';
import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

import { APP_SHELL_BORDER_CLASS, APP_SHELL_SURFACE_CLASS } from '@/components/common/pageChrome';

const COLLAPSED_PILL_GAP_PX = 10;

function useAnchorRect(anchorRef: React.RefObject<HTMLElement | null>, open: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setRect(null);
      return;
    }

    const update = () => {
      if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef, open]);

  return rect;
}

export function SidebarNavPill({
  anchorRef,
  open,
  label,
  isActive,
  href,
  onNavigate,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  label: string;
  isActive?: boolean;
  href?: string;
  onNavigate?: () => void;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}) {
  const rect = useAnchorRect(anchorRef, open);

  if (!open || !rect || typeof document === 'undefined') return null;

  const pillClass = cn(
    'flex h-8 max-w-[14rem] items-center truncate rounded-full border px-3 text-sm shadow-elevated active:scale-[0.98]',
    isActive
      ? cn(
          'border-sidebar-primary font-medium text-sidebar-primary shadow-md',
          APP_SHELL_SURFACE_CLASS,
        )
      : cn('text-foreground', APP_SHELL_SURFACE_CLASS, APP_SHELL_BORDER_CLASS),
  );

  const labelNode = href ? (
    <Link to={href} onClick={onNavigate} className="truncate">
      {label}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className="truncate text-left">
      {label}
    </button>
  );

  return createPortal(
    <div
      className="fixed z-[100] flex items-center"
      style={{
        top: rect.top,
        left: rect.right,
        height: rect.height,
        paddingLeft: COLLAPSED_PILL_GAP_PX,
        transition: 'none',
      }}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
    >
      <div className={pillClass}>{labelNode}</div>
    </div>,
    document.body,
  );
}
