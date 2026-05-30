import AiInlinePanel from "./AiInlinePanel";

export default function SearchHero({
  searchInput,
  setSearchInput,
  onSubmit,
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
  // ── AI inline mode ──
  aiInputMode,
  onEnterAiMode,
  onExitAiMode,
  aiPrompt,
  setAiPrompt,
  aiLoading,
  aiPreview,
  aiPreviewChips,
  aiPreviewFresh,
  aiPreviewError,
  onInterpretAi,
  onApplyAi,
  searchInputRef,
  // ── guided sub-mode ──
  aiPanelMode = "search",
  guidedSession,
  guidedLoading,
  guidedInputValue,
  setGuidedInputValue,
  guidedPlaceholder,
  onStartGuided,
  onGuidedSubmit,
  onGuidedChip,
  onGuidedSkip,
  onGuidedShowResults,
  onGuidedStartOver,
  onGuidedRemoveLast,
}) {
  const guidedMode = aiInputMode && aiPanelMode === "guided";

  const handleAiKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (aiPreviewFresh) onApplyAi();
      else onInterpretAi();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onExitAiMode();
    }
  };

  const handleGuidedKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onGuidedSubmit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onExitAiMode();
    }
  };

  const inputValue = guidedMode
    ? guidedInputValue || ""
    : aiInputMode
      ? aiPrompt
      : searchInput;
  const showClear = guidedMode
    ? !!guidedInputValue
    : aiInputMode
      ? !!aiPrompt
      : !!searchInput && !suggestionsLoading;

  return (
    <section className="sticky top-0 z-20 border-b border-[#e7edf3] bg-[#fbfcfe]">
      <div className="mx-auto max-w-[1700px] px-[12px] py-[10px]">
        <div className="rounded-[18px] border border-[#e7edf3] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <div className="px-[18px] py-[16px]">
            <div
              className="relative flex items-stretch"
              ref={suggestionsContainerRef}
            >
              <div
                data-tour="search-bar"
                className={`group relative flex h-[56px] w-full items-stretch rounded-[16px] border bg-[#fcfdff] transition-all duration-200 ${
                  aiInputMode
                    ? "border-[#1b6dff] bg-white shadow-[0_0_0_4px_rgba(27,109,255,0.12)]"
                    : "border-[#d8e1ea] focus-within:border-[#111827] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(15,23,42,0.06)]"
                }`}
              >
                <span className="inline-flex shrink-0 items-center pl-[18px] text-[#64748b]">
                  {aiInputMode ? (
                    <span className="grid h-[24px] w-[24px] place-items-center rounded-full bg-[#edf4ff] text-[#1b6dff]">
                      <SparkIcon className="h-[12px] w-[12px]" />
                    </span>
                  ) : (
                    <SearchIcon />
                  )}
                </span>
                <input
                  ref={searchInputRef}
                  value={inputValue}
                  onChange={(event) => {
                    if (guidedMode) {
                      setGuidedInputValue(event.target.value);
                    } else if (aiInputMode) {
                      setAiPrompt(event.target.value);
                    } else {
                      setSearchInput(event.target.value);
                      setSuggestionsOpen(true);
                    }
                  }}
                  onKeyDown={
                    guidedMode
                      ? handleGuidedKeyDown
                      : aiInputMode
                        ? handleAiKeyDown
                        : onKeyDown
                  }
                  placeholder={
                    guidedMode
                      ? guidedPlaceholder || "Type your answer, or pick an option below…"
                      : aiInputMode
                        ? "Describe what you need — e.g. ip65 3000k spotlights in stock under 500"
                        : "Search SKU, product name, category, or specification…"
                  }
                  className="h-full flex-1 bg-transparent px-[12px] text-[15px] text-[#111827] outline-none placeholder:text-[#97a3b6]"
                  autoComplete="off"
                  spellCheck={false}
                />
                {aiInputMode && (
                  <span className="hidden shrink-0 items-center pr-[4px] sm:inline-flex">
                    <span className="rounded-full bg-[#edf4ff] px-[8px] py-[3px] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">
                      {guidedMode ? "Guided" : "AI mode"}
                    </span>
                  </span>
                )}
                {!aiInputMode && suggestionsLoading && (
                  <span className="inline-flex shrink-0 items-center px-[10px] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                    …
                  </span>
                )}
                {showClear && (
                  <button
                    type="button"
                    onClick={() => {
                      if (guidedMode) {
                        setGuidedInputValue("");
                      } else if (aiInputMode) {
                        setAiPrompt("");
                      } else {
                        setSearchInput("");
                        setSuggestionsOpen(false);
                      }
                    }}
                    className="shrink-0 px-[10px] text-[18px] leading-none text-[#94a3b8] transition hover:text-[#111827]"
                    aria-label="Clear"
                  >
                    ×
                  </button>
                )}
                <span className="my-[12px] ml-[4px] w-px shrink-0 bg-[#e6ebf1]" aria-hidden="true" />
                <button
                  data-tour="ai-search-button"
                  type="button"
                  onClick={aiInputMode ? onExitAiMode : onEnterAiMode}
                  className={
                    aiInputMode
                      ? "group/ai ask-ai-btn m-[6px] inline-flex shrink-0 items-center gap-[7px] rounded-[12px] border border-[#cdddff] bg-[#eef5ff] px-[14px] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1d4ed8] transition"
                      : "group/ai ask-ai-btn m-[6px] inline-flex shrink-0 items-center gap-[7px] rounded-[12px] bg-gradient-to-r from-[#1b6dff] to-[#3f86ff] px-[14px] text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_4px_14px_rgba(27,109,255,0.3)] transition hover:shadow-[0_6px_18px_rgba(27,109,255,0.45)]"
                  }
                  title="Describe what you need in plain English — AI turns it into filters"
                >
                  <SparkIcon className="ask-ai-icon h-[13px] w-[13px]" />
                  <span className="ask-ai-label">{aiInputMode ? "Exit AI" : "Ask AI"}</span>
                  {!aiInputMode && (
                    <kbd className="ask-ai-kbd ml-[3px] hidden h-[18px] items-center rounded-[5px] border border-white/30 bg-white/15 px-[5px] text-[10px] font-semibold not-italic text-white sm:inline-flex">
                      ⌘K
                    </kbd>
                  )}
                </button>
                {!aiInputMode && (
                  <button
                    data-tour="search-submit-button"
                    type="button"
                    onClick={() => onSubmit()}
                    className="m-[6px] inline-flex shrink-0 items-center rounded-[12px] bg-[#111827] px-[18px] text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black"
                  >
                    Search
                    <ArrowRight className="ml-[7px]" />
                  </button>
                )}
              </div>

              {aiInputMode ? (
                <AiInlinePanel
                  mode={aiPanelMode}
                  prompt={aiPrompt}
                  loading={aiLoading}
                  preview={aiPreview}
                  previewChips={aiPreviewChips}
                  previewFresh={aiPreviewFresh}
                  error={aiPreviewError}
                  onInterpret={onInterpretAi}
                  onApply={onApplyAi}
                  onClose={onExitAiMode}
                  onPickExample={(example) => {
                    setAiPrompt(example);
                    onInterpretAi(example);
                  }}
                  onStartGuided={onStartGuided}
                  guidedSession={guidedSession}
                  guidedLoading={guidedLoading}
                  onGuidedChip={onGuidedChip}
                  onGuidedSkip={onGuidedSkip}
                  onGuidedShowResults={onGuidedShowResults}
                  onGuidedStartOver={onGuidedStartOver}
                  onGuidedRemoveLast={onGuidedRemoveLast}
                />
              ) : (
                suggestionsOpen &&
                suggestions.length > 0 && (
                  <div
                    className="absolute left-0 right-0 top-full z-30 mt-[6px] max-h-[400px] overflow-auto rounded-[16px] border border-[#e5e7eb] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.12)]"
                    style={{ scrollbarWidth: "thin" }}
                  >
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
                )
              )}
            </div>
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
      <style jsx>{`
        .ask-ai-btn {
          position: relative;
          z-index: 0;
          overflow: visible;
          transition: transform 0.2s ease;
        }

        .ask-ai-btn::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 14px;
          padding: 2px;
          background: linear-gradient(
            45deg,
            #ff0000,
            #ff7300,
            #fffb00,
            #48ff00,
            #00ffd5,
            #002bff,
            #7a00ff,
            #ff00c8,
            #ff0000
          );
          background-size: 400%;
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          animation: ask-ai-glow 20s linear infinite;
          pointer-events: none;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .ask-ai-icon {
          position: relative;
          z-index: 2;
          transition: transform 0.28s ease, filter 0.28s ease;
        }

        .ask-ai-label,
        .ask-ai-kbd {
          position: relative;
          z-index: 2;
        }

        .ask-ai-btn:hover {
          transform: translateY(-1px);
        }

        .ask-ai-btn:hover .ask-ai-icon {
          transform: rotate(-8deg) scale(1.12);
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.55));
          animation: ask-ai-float 0.9s ease-in-out infinite alternate;
        }

        .ask-ai-btn:hover::before {
          opacity: 1;
        }

        .ask-ai-btn:focus-visible::before {
          opacity: 1;
        }

        @keyframes ask-ai-glow {
          0% {
            background-position: 0 0;
          }
          50% {
            background-position: 400% 0;
          }
          100% {
            background-position: 0 0;
          }
        }

        @keyframes ask-ai-float {
          from {
            transform: rotate(-6deg) translateY(0) scale(1.1);
          }
          to {
            transform: rotate(7deg) translateY(-1px) scale(1.15);
          }
        }
      `}</style>
    </section>
  );
}

function SearchIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
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
    <svg
      className={`h-[14px] w-[14px] ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7L12 3z" />
      <path d="M18.5 14.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3z" />
      <path d="M5.5 14.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3z" />
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
