interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function AdminPagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-[1.25rem] border border-[var(--color-border)] bg-white px-4 py-3">
      <p className="text-sm text-[var(--color-text-secondary)]">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
