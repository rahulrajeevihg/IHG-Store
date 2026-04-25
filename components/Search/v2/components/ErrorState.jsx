export default function ErrorState({ message, hasFilters, onRetry }) {
  return (
    <div className="flex flex-col items-center border border-[#fecaca] bg-[#fef2f2] px-[24px] py-[48px] text-center">
      <p className="text-[15px] font-semibold text-[#b42318]">Unable to load results</p>
      <p className="mt-[6px] max-w-[480px] text-[13px] leading-[1.6] text-[#7f1d1d]">{message}</p>
      <p className="mt-[4px] max-w-[480px] text-[12px] leading-[1.6] text-[#6b7280]">
        {hasFilters
          ? "Try retrying. If the error continues, remove a filter and search again."
          : "Retry the search. If V2 remains unavailable, the page can fall back to V1."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-[16px] bg-[#111] px-[14px] py-[9px] text-[11px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-black"
      >
        Retry
      </button>
    </div>
  );
}
