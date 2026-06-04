export function SelectOptionsOverflowHint({
  truncated,
  total,
}: {
  truncated: number;
  total: number;
}) {
  if (truncated <= 0) return null;

  return (
    <div className="border-t border-border px-2 py-2 text-center text-xs text-muted-foreground">
      Type to narrow — {truncated} more of {total}
    </div>
  );
}
