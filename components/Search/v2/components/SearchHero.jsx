export default function SearchHero({
  searchInput,
  setSearchInput,
  onSubmit,
  onOpenAi,
  onKeyDown,
  suggestionsLoading,
  suggestionsOpen,
  setSuggestionsOpen,
  suggestions,
  activeSuggestionIndex,
  onSuggestionSelect,
  suggestionsContainerRef,
  loading,
  found,
  searchLatencyMs,
  suggestLatencyMs,
  fallbackMessage,
  aiExplanation,
}) {
  const formattedFound = loading ? "…" : Number(found || 0).toLocaleString();
  const latencyLabel = searchLatencyMs !== null ? formatLatency(searchLatencyMs) : null;

  return (
    <section className="sticky top-0 z-20 border-b border-[#e5e5e5] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-[1520px] px-[24px] py-[14px]">
        <div className="flex flex-wrap items-center justify-between gap-x-[16px] gap-y-[8px]">
          <div className="flex items-center gap-[8px] text-[11px] font-medium text-[#6b7280]">
            <span className="uppercase tracking-[0.14em]">Catalog</span>
            <ChevronRight />
            <span className="uppercase tracking-[0.14em] text-[#111]">All products</span>
          </div>
          <div className="flex items-center gap-[14px] text-[11px] text-[#6b7280]">
            <span>
              <span className="font-semibold text-[#111]">{formattedFound}</span> products
            </span>
            {latencyLabel && (
              <span className="inline-flex items-center gap-[5px]">
                <span className="h-[6px] w-[6px] rounded-full bg-[#16a34a]" aria-hidden="true" />
                {latencyLabel}
              </span>
            )}
          </div>
        </div>

        <div
          className="relative mt-[10px] flex items-stretch"
          ref={suggestionsContainerRef}
        >
          <div className="group relative flex h-[52px] w-full items-stretch border border-[#111] bg-white transition-shadow focus-within:shadow-[0_0_0_3px_rgba(17,17,17,0.08)]">
            <span className="inline-flex shrink-0 items-center pl-[16px] text-[#6b7280]">
              <SearchIcon />
            </span>
            <input
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setSuggestionsOpen(true);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search SKU, product name, category, or specification…"
              className="h-full flex-1 bg-transparent px-[12px] text-[15px] text-[#111] outline-none placeholder:text-[#9ca3af]"
              autoComplete="off"
              spellCheck={false}
            />
            {suggestionsLoading && (
              <span className="inline-flex shrink-0 items-center px-[6px] text-[10px] font-medium uppercase tracking-[0.18em] text-[#9ca3af]">
                …
              </span>
            )}
            {!!searchInput && !suggestionsLoading && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSuggestionsOpen(false);
                }}
                className="shrink-0 px-[8px] text-[16px] leading-none text-[#9ca3af] hover:text-[#111]"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
            <span className="my-[10px] w-px shrink-0 bg-[#e5e5e5]" aria-hidden="true" />
            <button
              type="button"
              onClick={onOpenAi}
              className="group/ai inline-flex shrink-0 items-center gap-[6px] px-[14px] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#111] hover:bg-[#fafafa]"
              title="Describe what you need in plain English"
            >
              <SparkIcon className="text-[#1b6dff]" />
              <span className="hidden sm:inline">AI</span>
            </button>
            <button
              type="button"
              onClick={() => onSubmit()}
              className="inline-flex shrink-0 items-center bg-[#111] px-[22px] text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-black"
            >
              Search
              <ArrowRight className="ml-[6px]" />
            </button>
          </div>

          {suggestionsOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-[6px] max-h-[420px] overflow-auto border border-[#111] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.item_code}-${index}`}
                  type="button"
                  onClick={() => onSuggestionSelect(suggestion)}
                  className={`flex w-full items-center justify-between gap-[12px] border-b border-[#f0f0f0] px-[16px] py-[11px] text-left last:border-b-0 ${
                    index === activeSuggestionIndex ? "bg-[#fafafa]" : "hover:bg-[#fafafa]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[12px] font-semibold text-[#111]">
                      {suggestion.item_code}
                    </p>
                    <p className="truncate text-[12px] text-[#6b7280]">
                      {suggestion.item_name}
                    </p>
                  </div>
                  {suggestion.brand && (
                    <span className="shrink-0 border border-[#e5e5e5] px-[8px] py-[3px] text-[10px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                      {suggestion.brand}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {(fallbackMessage || aiExplanation) && (
          <div className="mt-[10px] space-y-[6px]">
            {fallbackMessage && (
              <p className="inline-flex items-center gap-[6px] border border-[#fecaca] bg-[#fef2f2] px-[10px] py-[6px] text-[11px] font-medium text-[#b42318]">
                {fallbackMessage}
              </p>
            )}
            {aiExplanation && (
              <div className="flex items-start gap-[8px] border border-[#e5e5e5] bg-[#fafafa] px-[12px] py-[8px] text-[12px] leading-[1.55] text-[#374151]">
                <SparkIcon className="mt-[2px] shrink-0 text-[#1b6dff]" />
                <span>{aiExplanation}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function formatLatency(ms) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function SearchIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="h-[11px] w-[11px] text-[#9ca3af]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight({ className = "" }) {
  return (
    <svg className={`h-[12px] w-[12px] ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SparkIcon({ className = "" }) {
  return (
    <svg className={`h-[14px] w-[14px] ${className}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.9 5.2L19 9l-5.1 1.8L12 16l-1.9-5.2L5 9l5.1-1.8L12 2zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14zM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14z" />
    </svg>
  );
}
