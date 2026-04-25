export default function Pagination({ page, pageLength, total, onPageChange }) {
  const pageCount = Math.max(1, Math.ceil(total / pageLength));
  if (pageCount <= 1) {
    return null;
  }

  const pages = buildPageList(page, pageCount);

  return (
    <nav
      className="mt-[24px] flex flex-wrap items-center justify-between gap-[12px] border-t border-[#e5e5e5] py-[16px]"
      aria-label="Pagination"
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">
        Page {page} of {pageCount}
      </p>

      <div className="flex items-center gap-[4px]">
        <PageButton
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          ←
        </PageButton>
        {pages.map((entry, index) =>
          entry === "…" ? (
            <span
              key={`gap-${index}`}
              className="px-[6px] text-[11px] text-[#9ca3af]"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <PageButton
              key={entry}
              active={entry === page}
              onClick={() => onPageChange(entry)}
              aria-label={`Go to page ${entry}`}
              aria-current={entry === page ? "page" : undefined}
            >
              {entry}
            </PageButton>
          )
        )}
        <PageButton
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          →
        </PageButton>
      </div>
    </nav>
  );
}

function PageButton({ active, disabled, onClick, children, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      {...rest}
      className={`inline-flex h-[34px] min-w-[34px] items-center justify-center border px-[8px] text-[12px] font-medium transition ${
        active
          ? "border-[#111] bg-[#111] text-white"
          : "border-[#e5e5e5] bg-white text-[#111] hover:border-[#111]"
      } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#e5e5e5]`}
    >
      {children}
    </button>
  );
}

function buildPageList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = [...pages]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);

  const result = [];
  sorted.forEach((num, idx) => {
    if (idx > 0 && num - sorted[idx - 1] > 1) {
      result.push("…");
    }
    result.push(num);
  });
  return result;
}
