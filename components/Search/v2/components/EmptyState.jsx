export default function EmptyState({ query, hasFilters, onClear, onAskAi }) {
  return (
    <div className="flex flex-col items-center border border-dashed border-[#e5e5e5] bg-white px-[24px] py-[56px] text-center">
      <div className="mb-[14px] inline-flex h-[44px] w-[44px] items-center justify-center border border-[#e5e5e5]">
        <svg className="h-[20px] w-[20px] text-[#9ca3af]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-[16px] font-semibold text-[#111]">No matching products</p>
      <p className="mt-[6px] max-w-[480px] text-[13px] leading-[1.6] text-[#6b7280]">
        {hasFilters
          ? "Try removing a filter, or broaden your query."
          : query
            ? "Try a broader term, a partial SKU, or fewer constraints."
            : "Try a SKU, product family, or a spec like IP rating or color temperature."}
      </p>
      <div className="mt-[18px] flex flex-wrap items-center justify-center gap-[8px]">
        <button
          type="button"
          onClick={onClear}
          className="border border-[#111] bg-white px-[14px] py-[9px] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#111] hover:bg-[#fafafa]"
        >
          Clear filters
        </button>
        {onAskAi && (
          <button
            type="button"
            onClick={onAskAi}
            className="inline-flex items-center gap-[6px] rounded-[10px] bg-gradient-to-r from-[#1b6dff] to-[#3f86ff] px-[14px] py-[9px] text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_4px_14px_rgba(27,109,255,0.3)] transition hover:from-[#155fe0] hover:to-[#2f78f5] hover:shadow-[0_6px_18px_rgba(27,109,255,0.45)]"
          >
            <svg className="h-[12px] w-[12px]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l1.9 5.2L19 9l-5.1 1.8L12 16l-1.9-5.2L5 9l5.1-1.8L12 2z" />
            </svg>
            Ask AI
          </button>
        )}
      </div>
    </div>
  );
}
