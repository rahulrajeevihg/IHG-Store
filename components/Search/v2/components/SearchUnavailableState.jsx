import { SEARCH_V2_DISABLED_DISPLAY_MESSAGE } from "@/libs/ighSearchV2Errors.mjs";

export default function SearchUnavailableState({
  message = SEARCH_V2_DISABLED_DISPLAY_MESSAGE,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="search-unavailable-state"
      className="flex flex-col items-center border border-dashed border-[#e5e5e5] bg-white px-[24px] py-[56px] text-center"
    >
      <div className="mb-[14px] inline-flex h-[44px] w-[44px] items-center justify-center border border-[#e5e5e5]">
        <svg
          className="h-[20px] w-[20px] text-[#9ca3af]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" strokeLinecap="round" />
          <path d="M12 16h.01" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-[16px] font-semibold text-[#111]">
        Search is temporarily unavailable
      </p>
      <p className="mt-[6px] max-w-[480px] text-[13px] leading-[1.6] text-[#6b7280]">
        {message}
      </p>
    </div>
  );
}
