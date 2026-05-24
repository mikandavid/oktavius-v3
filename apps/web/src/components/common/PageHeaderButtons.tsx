import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

import {
  Button,
  buttonVariants,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type ButtonProps,
} from '@oktavius/base-ui';
import { ExportIcon, SpinnerIcon } from '@/lib/icons';

import { PAGE_HEADER_ACTIONS_ROW } from './pageChrome';

/**
 * Fixed page-header action order (left → right):
 * 1. Export (icon-only, when `exportOptions` on CrudMainView)
 * 2. Secondary actions (`headerActions` — e.g. Board view)
 * 3. Primary CTA last (e.g. New case)
 */
export const PAGE_HEADER_BUTTON_SIZE = 'sm' as const;

export const PAGE_HEADER_ICON_BUTTON_CLASS = 'h-7 w-7 shrink-0';

const pageHeaderButtonClass = 'shrink-0';

type PageHeaderCtaButtonProps = ButtonProps;

export function PageHeaderCtaButton({
  className,
  size: _size,
  ...props
}: PageHeaderCtaButtonProps) {
  return (
    <Button
      variant="cta"
      size={PAGE_HEADER_BUTTON_SIZE}
      className={cn(pageHeaderButtonClass, className)}
      {...props}
    />
  );
}

type PageHeaderOutlineButtonProps = ButtonProps;

export function PageHeaderOutlineButton({
  className,
  size: _size,
  ...props
}: PageHeaderOutlineButtonProps) {
  return (
    <Button
      variant="outline"
      size={PAGE_HEADER_BUTTON_SIZE}
      className={cn(pageHeaderButtonClass, className)}
      {...props}
    />
  );
}

type PageHeaderCtaLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
};

/** CTA-styled router link for list-page “New X” actions (same height as other header buttons). */
export function PageHeaderCtaLink({ className, children, ...props }: PageHeaderCtaLinkProps) {
  return (
    <Link
      className={cn(
        buttonVariants({ variant: 'cta', size: PAGE_HEADER_BUTTON_SIZE }),
        pageHeaderButtonClass,
        'inline-flex items-center justify-center gap-1.5',
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

type PageHeaderOutlineLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
};

export function PageHeaderOutlineLink({
  className,
  children,
  ...props
}: PageHeaderOutlineLinkProps) {
  return (
    <Link
      className={cn(
        buttonVariants({ variant: 'outline', size: PAGE_HEADER_BUTTON_SIZE }),
        pageHeaderButtonClass,
        'inline-flex items-center justify-center gap-1.5',
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function PageHeaderActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(PAGE_HEADER_ACTIONS_ROW, className)}>{children}</div>;
}

type PageHeaderExportButtonProps = {
  label?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onClick: () => void;
};

/** Icon-only export — always first in the header row when present. */
export function PageHeaderExportButton({
  label = 'Export',
  disabled,
  isLoading,
  onClick,
}: PageHeaderExportButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={PAGE_HEADER_ICON_BUTTON_CLASS}
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          {isLoading ? (
            <SpinnerIcon size={14} className="animate-spin" />
          ) : (
            <ExportIcon size={14} />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
