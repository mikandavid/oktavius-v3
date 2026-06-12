import {
  Button,
  cn,
  InlineEmptyState,
  ScrollArea,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@oktavius/base-ui';
import { useEffect, useMemo, useState } from 'react';

import { DownloadIcon, SpinnerIcon } from '@/lib/icons';

import {
  inferPreviewDocumentKind,
  type PdfPreviewFitMode,
  type PreviewDocument,
} from './documentPreviewTypes';
import { downloadPreviewDocument, resolvePreviewDownloadUrl } from './documentPreviewUtils';
import { PdfDocumentPreview } from './PdfDocumentPreview';

const MAX_PREVIEW_ROWS = 100;

type TablePreviewData = {
  headers: string[];
  rows: string[][];
  totalRows: number;
};

export interface DocumentPreviewProps {
  document: PreviewDocument | null;
  bodyClassName?: string;
  className?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  comfortableImagePreview?: boolean;
  /** Browser PDF viewer fit mode — use `page-fit` when the whole page should be visible. */
  pdfFitMode?: PdfPreviewFitMode;
}

function PreviewFallback({
  message,
  document,
  sourceUrl,
  className,
}: {
  message: string;
  document: PreviewDocument;
  sourceUrl: string | null;
  className?: string;
}) {
  const canDownload = Boolean(resolvePreviewDownloadUrl(document, sourceUrl));

  return (
    <div className={cn('space-y-3', className)}>
      <InlineEmptyState text={message} centered />
      {canDownload ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadPreviewDocument(document, sourceUrl)}
          >
            <DownloadIcon size={14} className="mr-1.5" />
            Download
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function parseDelimited(text: string, separator: string): TablePreviewData {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const parseLine = (line: string) => line.split(separator).map((value) => value.trim());
  // lines.length checked above
  const headers = parseLine(lines[0]!);
  const dataLines = lines.slice(1);
  const rows = dataLines.slice(0, MAX_PREVIEW_ROWS).map(parseLine);

  return { headers, rows, totalRows: dataLines.length };
}

async function loadSpreadsheet(document: PreviewDocument): Promise<TablePreviewData> {
  const XLSX = await import('xlsx');
  const arrayBuffer = document.file
    ? await document.file.arrayBuffer()
    : await fetch(document.sourceUrl || '').then((response) => response.arrayBuffer());
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
  if (!firstSheet) {
    return { headers: [], rows: [], totalRows: 0 };
  }
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(firstSheet, {
    header: 1,
    blankrows: false,
  });

  const headerRow = rows[0]?.map((value) => String(value ?? '')) || [];
  const dataRows = rows.slice(1);
  const normalizedDataRows = dataRows
    .slice(0, MAX_PREVIEW_ROWS)
    .map((row) => row.map((value) => String(value ?? '')));

  return {
    headers: headerRow,
    rows: normalizedDataRows,
    totalRows: dataRows.length,
  };
}

function TablePreview({ data }: { data: TablePreviewData }) {
  if (data.headers.length === 0) {
    return <InlineEmptyState text="No rows in this file." centered />;
  }

  return (
    <div className="space-y-2">
      <ScrollArea className="max-h-[min(420px,60vh)] rounded-control border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              {data.headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, rowIndex) => (
              <TableRow key={`row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={`cell-${rowIndex}-${cellIndex}`}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      {data.totalRows > MAX_PREVIEW_ROWS ? (
        <p className="text-xs text-muted-foreground">
          Showing {MAX_PREVIEW_ROWS} of {data.totalRows} rows.
        </p>
      ) : null}
    </div>
  );
}

/** Renders PDF, image, text, CSV, and spreadsheet previews from a URL or File. */
export function DocumentPreview({
  document,
  bodyClassName,
  className,
  isLoading = false,
  errorMessage = null,
  comfortableImagePreview = false,
  pdfFitMode = 'page-fit',
}: DocumentPreviewProps) {
  const kind = useMemo(() => (document ? inferPreviewDocumentKind(document) : 'other'), [document]);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [tableContent, setTableContent] = useState<TablePreviewData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const sourceUrl = useMemo(() => {
    if (document?.file) {
      return URL.createObjectURL(document.file);
    }
    return document?.sourceUrl ?? null;
  }, [document?.file, document?.sourceUrl]);

  useEffect(() => {
    if (!document?.file) return;
    return () => {
      if (sourceUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(sourceUrl);
      }
    };
  }, [document?.file, sourceUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      if (!document) {
        setTextContent(null);
        setTableContent(null);
        setFetchError(null);
        return;
      }

      if (kind === 'pdf' || kind === 'image' || kind === 'other') {
        setTextContent(null);
        setTableContent(null);
        setFetchError(null);
        return;
      }

      setIsFetching(true);
      setFetchError(null);

      try {
        if (kind === 'text') {
          const text = document.file
            ? await document.file.text()
            : await fetch(document.sourceUrl || '').then((response) => response.text());
          if (!cancelled) setTextContent(text);
        } else if (kind === 'csv') {
          const text = document.file
            ? await document.file.text()
            : await fetch(document.sourceUrl || '').then((response) => response.text());
          const separator = document.name.toLowerCase().endsWith('.tsv') ? '\t' : ',';
          if (!cancelled) setTableContent(parseDelimited(text, separator));
        } else if (kind === 'excel') {
          const table = await loadSpreadsheet(document);
          if (!cancelled) setTableContent(table);
        }
      } catch {
        if (!cancelled) {
          setFetchError('Could not load preview for this file.');
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }

    void loadContent();
    return () => {
      cancelled = true;
    };
  }, [document, kind]);

  const resolvedError = errorMessage || fetchError;

  if (!document) {
    return (
      <div className={cn('flex min-h-[200px] items-center justify-center', className)}>
        <InlineEmptyState text="Select a document to preview." centered />
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className={cn('space-y-3', className, bodyClassName)}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[min(420px,60vh)] w-full" />
      </div>
    );
  }

  if (resolvedError) {
    return (
      <PreviewFallback
        message={resolvedError}
        document={document}
        sourceUrl={sourceUrl}
        className={cn(className, bodyClassName)}
      />
    );
  }

  return (
    <div className={cn('flex min-h-0 min-w-0 flex-col', className, bodyClassName)}>
      {kind === 'pdf' && sourceUrl ? (
        <PdfDocumentPreview
          sourceUrl={sourceUrl}
          title={document.name}
          fitMode={pdfFitMode}
          className="min-h-0 flex-1"
        />
      ) : null}

      {kind === 'image' && sourceUrl ? (
        <div className="flex justify-center rounded-control bg-muted/15 p-4">
          <img
            src={sourceUrl}
            alt={document.name}
            width={640}
            height={420}
            loading="lazy"
            decoding="async"
            className={cn(
              'max-h-[min(420px,60vh)] rounded-control object-contain',
              comfortableImagePreview ? 'max-w-md' : 'max-w-full',
            )}
          />
        </div>
      ) : null}

      {kind === 'text' && textContent !== null ? (
        <ScrollArea className="max-h-[min(420px,60vh)] rounded-control border border-border/50 bg-muted/15 p-3">
          <pre className="whitespace-pre-wrap text-xs text-foreground">{textContent}</pre>
        </ScrollArea>
      ) : null}

      {(kind === 'csv' || kind === 'excel') && tableContent ? (
        <TablePreview data={tableContent} />
      ) : null}

      {kind === 'other' ? (
        <PreviewFallback
          message="Preview not available for this file type."
          document={document}
          sourceUrl={sourceUrl}
        />
      ) : null}

      {isFetching ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <SpinnerIcon size={14} className="animate-spin" />
          Loading preview…
        </div>
      ) : null}
    </div>
  );
}
