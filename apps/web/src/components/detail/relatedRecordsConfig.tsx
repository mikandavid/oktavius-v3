import { RelatedRecordsPanel, type RelatedRecordItem } from './RelatedRecordsPanel';

export type RelatedRecordsConfig<TParent, TRow> = {
  title: string;
  emptyLabel?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  addLabel?: string;
  onAdd?: () => void;
  match: (parent: TParent, row: TRow) => boolean;
  item: (row: TRow, parent: TParent) => RelatedRecordItem;
};

type GeneratedRelatedRecordsPanelProps<TParent, TRow> = {
  config: RelatedRecordsConfig<TParent, TRow>;
  parent: TParent;
  rows: TRow[];
  className?: string;
};

export function buildRelatedRecordItems<TParent, TRow>(
  config: RelatedRecordsConfig<TParent, TRow>,
  parent: TParent,
  rows: TRow[],
) {
  return rows.filter((row) => config.match(parent, row)).map((row) => config.item(row, parent));
}

/** Renders a related-record panel from a generated relation config. */
export function GeneratedRelatedRecordsPanel<TParent, TRow>({
  config,
  parent,
  rows,
  className,
}: GeneratedRelatedRecordsPanelProps<TParent, TRow>) {
  return (
    <RelatedRecordsPanel
      title={config.title}
      records={buildRelatedRecordItems(config, parent, rows)}
      emptyLabel={config.emptyLabel}
      viewAllHref={config.viewAllHref}
      viewAllLabel={config.viewAllLabel}
      onAdd={config.onAdd}
      addLabel={config.addLabel}
      className={className}
    />
  );
}
