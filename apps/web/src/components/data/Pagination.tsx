import { Button } from '@oktavius/base-ui';

import { ChevronLeftIcon, ChevronRightIcon } from '@/lib/icons';

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, pageSize, total, totalPages, onPageChange }: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(total, safePage * pageSize);

  return (
    <div className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {total === 0 ? 'No records' : `${start}-${end} of ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
        >
          <ChevronLeftIcon size={16} />
          Previous
        </Button>
        <span className="text-xs font-medium text-muted-foreground">
          Page {safePage} of {safeTotalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= safeTotalPages}
        >
          Next
          <ChevronRightIcon size={16} />
        </Button>
      </div>
    </div>
  );
}
