import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  InlineEmptyState,
  cn,
} from '@oktavius/base-ui';

import { ExternalLinkIcon, MapIcon, SpinnerIcon } from '@/lib/icons';

import { resolveGoogleMapsEmbed } from './googleMapsEmbed';

const LOAD_TIMEOUT_MS = 12_000;

type GoogleMapsEmbedFrameProps = {
  url: string;
  title?: string;
  className?: string;
  style?: CSSProperties;
  onExpand?: () => void;
};

/** Shared iframe map renderer for inline previews and dialogs. */
export function GoogleMapsEmbedFrame({
  url,
  title = 'Map preview',
  className,
  style,
  onExpand,
}: GoogleMapsEmbedFrameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const loadTimeoutRef = useRef<number | null>(null);
  const { embedUrl, canEmbed } = resolveGoogleMapsEmbed(url);

  useEffect(() => {
    setIsLoading(true);
    setHasError(!canEmbed || !embedUrl);

    if (!canEmbed || !embedUrl) return undefined;

    loadTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
      setHasError(true);
    }, LOAD_TIMEOUT_MS);

    return () => {
      if (loadTimeoutRef.current !== null) {
        window.clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [canEmbed, embedUrl, url]);

  const handleLoad = () => {
    if (loadTimeoutRef.current !== null) {
      window.clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    setIsLoading(false);
    setHasError(false);
  };

  if (!canEmbed || !embedUrl) {
    return (
      <div
        className={cn(
          'flex h-full min-h-[220px] flex-col items-center justify-center gap-4 bg-muted/20 p-6 text-center',
          className,
        )}
      >
        <InlineEmptyState text="Map preview is unavailable for this link." centered />
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLinkIcon size={14} className="mr-1.5" />
          Open in Google Maps
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('relative min-h-0 overflow-hidden bg-muted/30', className)} style={style}>
      {isLoading && !hasError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80">
          <div className="flex flex-col items-center gap-3">
            <SpinnerIcon size={24} className="animate-spin text-cta" />
            <p className="text-sm text-muted-foreground">Loading map…</p>
          </div>
        </div>
      ) : null}

      {hasError ? (
        <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-4 p-6 text-center">
          <InlineEmptyState text="Map preview could not be loaded." centered />
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLinkIcon size={14} className="mr-1.5" />
            Open in Google Maps
          </Button>
        </div>
      ) : (
        <iframe
          title={title}
          src={embedUrl}
          className={cn('h-full w-full border-0', isLoading && 'opacity-0')}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-popups"
          onLoad={handleLoad}
        />
      )}

      {onExpand ? (
        <div className="absolute right-3 top-3 z-20">
          <Button variant="outline" size="sm" className="bg-card/90 shadow-sm" onClick={onExpand}>
            Expand
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type GoogleMapsPreviewProps = {
  url: string;
  title?: string;
  height?: number;
  className?: string;
  showHeader?: boolean;
  onExpand?: () => void;
};

/** Inline map preview — no dialog required. */
export function GoogleMapsPreview({
  url,
  title = 'Map preview',
  height = 320,
  className,
  showHeader = true,
  onExpand,
}: GoogleMapsPreviewProps) {
  return (
    <div className={cn('overflow-hidden rounded-card border border-border/60 bg-card', className)}>
      {showHeader ? (
        <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-control bg-muted">
              <MapIcon size={16} className="text-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">{title}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLinkIcon size={14} className="mr-1.5" />
            Open in Google Maps
          </Button>
        </div>
      ) : null}
      <GoogleMapsEmbedFrame
        url={url}
        title={title}
        className="w-full"
        style={{ height }}
        onExpand={onExpand}
      />
    </div>
  );
}

type GoogleMapsDialogProps = {
  url: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
};

/** Full-screen dialog map preview. */
export function GoogleMapsDialog({
  url,
  open,
  onOpenChange,
  title = 'Map preview',
}: GoogleMapsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[80vh] max-w-[900px] flex-col gap-0 p-0 sm:max-w-[90vw]">
        <DialogHeader className="flex-shrink-0 border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-control bg-muted">
                <MapIcon size={16} className="text-foreground" />
              </div>
              <DialogTitle className="text-base">{title}</DialogTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLinkIcon size={14} className="mr-1.5" />
              Open in Google Maps
            </Button>
          </div>
        </DialogHeader>

        <GoogleMapsEmbedFrame url={url} title={title} className="min-h-0 flex-1" />
      </DialogContent>
    </Dialog>
  );
}

type GoogleMapsPreviewButtonProps = {
  url: string;
  className?: string;
  label?: string;
  title?: string;
};

export function GoogleMapsPreviewButton({
  url,
  className,
  label = 'View route',
  title,
}: GoogleMapsPreviewButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" className={cn(className)} onClick={() => setOpen(true)}>
        <MapIcon size={14} className="mr-1.5" />
        {label}
      </Button>
      <GoogleMapsDialog url={url} open={open} onOpenChange={setOpen} title={title} />
    </>
  );
}

export { extractGoogleMapsUrls } from './googleMapsEmbed';
