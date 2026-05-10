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
    <section className="sticky top-0 z-20 border-b border-[#e7edf3] bg-[#fbfcfe]">
      <div className="mx-auto max-w-[1700px] px-[12px] py-[10px]">
        <div className="rounded-[18px] border border-[#e7edf3] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-x-[18px] gap-y-[10px] border-b border-[#eef2f6] px-[18px] py-[14px]">
            <div className="flex min-w-0 flex-col gap-[7px]">
              <div className="flex items-center gap-[8px] text-[11px] font-semibold text-[#7b8794]">
                <span className="uppercase tracking-[0.18em]">Catalog</span>
                <ChevronRight />
                <span className="uppercase tracking-[0.18em] text-[#111827]">All products</span>
              </div>
              <div className="flex flex-wrap items-center gap-[10px]">
                <h1 className="text-[18px] font-semibold tracking-[-0.03em] text-[#111827]">
                  Product Catalog
                </h1>
                <span className="inline-flex items-center rounded-full bg-[#f4f7fb] px-[10px] py-[4px] text-[11px] font-semibold text-[#5b6472]">
                  Browse fast. Filter precisely.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-[10px]">
              <MetricCard
                label="Live results"
                value={`${formattedFound} products`}
                tone="default"
              />
              {latencyLabel && (
                <MetricCard
                  label="Response time"
                  value={latencyLabel}
                  tone="success"
                />
              )}
            </div>
          </div>

          <div className="px-[18px] py-[16px]">
            <div
              className="relative flex items-stretch"
              ref={suggestionsContainerRef}
            >
              <div className="group relative flex h-[56px] w-full items-stretch rounded-[16px] border border-[#d8e1ea] bg-[#fcfdff] transition-all duration-200 focus-within:border-[#111827] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(15,23,42,0.06)]">
                <span className="inline-flex shrink-0 items-center pl-[18px] text-[#64748b]">
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
                  className="h-full flex-1 bg-transparent px-[12px] text-[15px] text-[#111827] outline-none placeholder:text-[#97a3b6]"
                  autoComplete="off"
                  spellCheck={false}
                />
                {suggestionsLoading && (
                  <span className="inline-flex shrink-0 items-center px-[10px] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
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
                    className="shrink-0 px-[10px] text-[18px] leading-none text-[#94a3b8] transition hover:text-[#111827]"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
                <span className="my-[12px] w-px shrink-0 bg-[#e6ebf1]" aria-hidden="true" />
                <button
                  type="button"
                  onClick={onOpenAi}
                  className="group/ai inline-flex shrink-0 items-center gap-[7px] rounded-r-none px-[14px] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1f2937] transition hover:bg-[#f5f8fc]"
                  title="Describe what you need in plain English"
                >
                  <span className="grid h-[24px] w-[24px] place-items-center rounded-full bg-[#edf4ff] text-[#1b6dff] transition group-hover/ai:bg-[#dce9ff]">
                    <SparkIcon className="h-[12px] w-[12px]" />
                  </span>
                  <span className="hidden sm:inline">Ask AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSubmit()}
                  className="m-[6px] inline-flex shrink-0 items-center rounded-[12px] bg-[#111827] px-[18px] text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black"
                >
                  Search
                  <ArrowRight className="ml-[7px]" />
                </button>
              </div>
            </div>

            {suggestionsOpen && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-30 mt-[6px] max-h-[400px] overflow-auto rounded-[16px] border border-[#e5e7eb] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.12)]" style={{ scrollbarWidth: "thin" }}>
                {suggestions.map((suggestion, index) => {
                  const isActive = index === activeSuggestionIndex;
                  return (
                    <button
                      key={`${suggestion.item_code}-${index}`}
                      type="button"
                      onClick={() => onSuggestionSelect(suggestion)}
                      className={`relative flex w-full items-center justify-between gap-[12px] border-b border-[#f4f6f8] px-[16px] py-[11px] text-left last:border-b-0 transition-colors duration-100 ${
                        isActive ? "bg-[#f0f6ff]" : "hover:bg-[#f9fafb]"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-[#3b82f6]" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[12px] font-semibold text-[#111]">
                          {highlightQuery(suggestion.item_code, searchInput)}
                        </p>
                        <p className="truncate text-[12px] text-[#6b7280]">
                          {highlightQuery(suggestion.item_name, searchInput)}
                        </p>
                      </div>
                      {suggestion.brand && (
                        <span className="shrink-0 rounded-md border border-[#e5e5e5] px-[8px] py-[3px] text-[10px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                          {suggestion.brand}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {(fallbackMessage || aiExplanation) && (
            <div className="border-t border-[#eef2f6] px-[18px] py-[12px]">
              <div className="space-y-[8px]">
                {fallbackMessage && (
                  <p className="inline-flex items-center gap-[6px] rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-[10px] py-[6px] text-[11px] font-medium text-[#b42318]">
                    {fallbackMessage}
                  </p>
                )}
                {aiExplanation && (
                  <div className="flex items-start gap-[9px] rounded-[14px] border border-[#e5edf7] bg-[#f7faff] px-[12px] py-[9px] text-[12px] leading-[1.55] text-[#3b4a5c]">
                    <SparkIcon className="mt-[2px] shrink-0 text-[#1b6dff]" />
                    <span>{aiExplanation}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, tone = "default" }) {
  const toneClass =
    tone === "success"
      ? "border-[#d9f3df] bg-[#f4fbf6] text-[#166534]"
      : "border-[#e8edf3] bg-[#f8fafc] text-[#4b5563]";

  return (
    <div className={`inline-flex items-center gap-[8px] rounded-[12px] border px-[10px] py-[7px] ${toneClass}`}>
      {tone === "success" && (
        <span className="h-[7px] w-[7px] rounded-full bg-[#16a34a]" aria-hidden="true" />
      )}
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
          {label}
        </span>
        <span className="mt-[5px] text-[13px] font-semibold tracking-[-0.02em] text-[#111827]">
          {value}
        </span>
      </div>
    </div>
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

function highlightQuery(text, query) {
  if (!text || !query || query.trim().length < 2) return text;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const splitRe = new RegExp(`(${escaped})`, "ig");
  const matchRe = new RegExp(`^${escaped}$`, "i");
  const parts = String(text).split(splitRe);
  return parts.map((part, i) =>
    matchRe.test(part) ? (
      <mark key={i} className="bg-[#fef08a] text-inherit not-italic font-semibold">{part}</mark>
    ) : part
  );
}
