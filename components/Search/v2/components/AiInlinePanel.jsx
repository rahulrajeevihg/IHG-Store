import { check_Image } from "@/libs/api";
import { getGuidedQuestionMeta, getGuidedUserMessages } from "@/libs/aiGuidedSearch";

const EXAMPLES = [
  "ip65 3000k downlights in stock under 500",
  "warm white led strip, 24v, waterproof",
  "dimmable led driver 24v 150w in stock",
  "high lumen track lights above 3000lm",
];

/**
 * Inline AI search panel that expands directly under the search bar.
 * Flow: idle → (Enter) loading → preview (interpreted filters + match count)
 * → (Apply) commits the already-fetched results to the product grid.
 *
 * The interpret call returns chips + count + hits in one shot, so Apply is an
 * instant client-side commit — no second network round-trip.
 */
export default function AiInlinePanel({
  mode = "search",
  prompt,
  loading,
  preview,
  previewChips = [],
  previewFresh,
  error,
  onInterpret,
  onApply,
  onClose,
  onPickExample,
  onStartGuided,
  // ── guided sub-mode ──
  guidedSession,
  guidedLoading,
  onGuidedChip,
  onGuidedSkip,
  onGuidedShowResults,
  onGuidedStartOver,
  onGuidedRemoveLast,
}) {
  const found = Number(preview?.found) || 0;
  const sampleHits = Array.isArray(preview?.hits) ? preview.hits.slice(0, 5) : [];

  return (
    <div
      data-tour="ai-inline-panel"
      className="absolute left-0 right-0 top-full z-30 mt-[8px] overflow-hidden rounded-[18px] border border-[#dbe6f2] bg-white shadow-[0_24px_60px_rgba(9,17,31,0.16)]"
    >
      {/* Accent rail */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#1b6dff] via-[#3f86ff] to-[#7aa8ff]" />

      <div className="p-[16px] md:p-[18px]">
        {mode === "guided" ? (
          <GuidedView
            session={guidedSession}
            loading={guidedLoading}
            onChip={onGuidedChip}
            onSkip={onGuidedSkip}
            onShowResults={onGuidedShowResults}
            onStartOver={onGuidedStartOver}
            onRemoveLast={onGuidedRemoveLast}
          />
        ) : loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={onInterpret} />
        ) : preview ? (
          found > 0 ? (
            <PreviewState
              preview={preview}
              chips={previewChips}
              found={found}
              sampleHits={sampleHits}
              fresh={previewFresh}
              onApply={onApply}
              onInterpret={onInterpret}
              onStartGuided={onStartGuided}
            />
          ) : (
            <NoMatchState chips={previewChips} onClose={onClose} />
          )
        ) : (
          <IdleState prompt={prompt} onPickExample={onPickExample} />
        )}
      </div>
    </div>
  );
}

/* ── States ─────────────────────────────────────────────────────────── */

function IdleState({ prompt, onPickExample }) {
  return (
    <div>
      <div className="flex items-center gap-[8px]">
        <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[#edf4ff] text-[#1b6dff]">
          <SparkIcon className="h-[13px] w-[13px]" />
        </span>
        <p className="text-[13px] font-semibold text-[#0f172a]">
          Describe what you need — AI turns it into catalog filters
        </p>
      </div>
      <p className="mt-[8px] text-[12px] leading-[1.6] text-[#64748b]">
        Type a plain-English request and press{" "}
        <Kbd>Enter</Kbd> to preview the filters before they’re applied.
      </p>

      <p className="mt-[14px] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
        Try one of these
      </p>
      <div className="mt-[8px] flex flex-col gap-[6px]">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onPickExample(example)}
            className="group flex items-center gap-[10px] rounded-[12px] border border-[#e6edf4] bg-[#fbfdff] px-[12px] py-[10px] text-left transition hover:border-[#bfd2eb] hover:bg-white hover:shadow-[0_8px_16px_rgba(15,23,42,0.06)]"
          >
            <ArrowReturn className="h-[13px] w-[13px] shrink-0 text-[#94a3b8] transition group-hover:text-[#1b6dff]" />
            <span className="text-[13px] text-[#334155] transition group-hover:text-[#0f172a]">
              {example}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div>
      <div className="flex items-center gap-[8px]">
        <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[#edf4ff] text-[#1b6dff]">
          <SparkIcon className="h-[13px] w-[13px] motion-safe:animate-pulse" />
        </span>
        <p className="text-[13px] font-semibold text-[#0f172a]">
          Interpreting your request…
        </p>
      </div>
      <div className="mt-[14px] flex flex-wrap gap-[8px]">
        {[88, 64, 104, 72].map((w, i) => (
          <span
            key={i}
            className="h-[26px] rounded-full bg-[#eef2f7] motion-safe:animate-pulse"
            style={{ width: w }}
          />
        ))}
      </div>
      <div className="mt-[14px] h-[44px] rounded-[12px] bg-[#eef2f7] motion-safe:animate-pulse" />
    </div>
  );
}

function PreviewState({ preview, chips, found, sampleHits, fresh, onApply, onInterpret, onStartGuided }) {
  const displayQuery =
    typeof preview?.display_query === "string" ? preview.display_query.trim() : "";
  const showRefine = typeof onStartGuided === "function" && found > 12;

  return (
    <div>
      <div className="flex items-start justify-between gap-[12px]">
        <div className="flex items-center gap-[8px]">
          <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[#e7f8ee] text-[#16a34a]">
            <CheckIcon className="h-[14px] w-[14px]" />
          </span>
          <p className="text-[13px] font-semibold text-[#0f172a]">
            AI understood your request
          </p>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
          Esc to cancel
        </span>
      </div>

      {displayQuery && (
        <p className="mt-[10px] text-[12px] text-[#475467]">
          Searching for{" "}
          <span className="font-semibold text-[#0f172a]">“{displayQuery}”</span>
        </p>
      )}

      {chips.length > 0 && (
        <div className="mt-[10px] flex flex-wrap gap-[7px]">
          {chips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-[6px] rounded-full border border-[#d8e5ff] bg-[#f3f8ff] px-[10px] py-[5px] text-[11px] text-[#1d4ed8]"
            >
              <span className="font-semibold uppercase tracking-[0.08em] text-[#3f86ff]">
                {chip.label}
              </span>
              <span className="font-mono text-[#1e3a8a]">{chip.value}</span>
            </span>
          ))}
        </div>
      )}

      {sampleHits.length > 0 && (
        <div className="mt-[14px] flex items-center gap-[8px]">
          {sampleHits.map((hit, idx) => {
            const doc = hit?.document || hit || {};
            const img =
              check_Image(doc?.images?.[0]?.image || doc?.website_image_url) ||
              "/empty-states.png";
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={doc?.item_code || idx}
                src={img}
                alt={doc?.item_name || "Product"}
                className="h-[44px] w-[44px] rounded-[10px] border border-[#eef1f5] bg-[#f7f8fa] object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/empty-states.png";
                }}
              />
            );
          })}
          {found > sampleHits.length && (
            <span className="text-[12px] font-medium text-[#64748b]">
              +{found - sampleHits.length} more
            </span>
          )}
        </div>
      )}

      <div className="mt-[16px] flex flex-wrap items-center gap-[10px]">
        <button
          data-tour="ai-inline-apply"
          type="button"
          onClick={onApply}
          className="inline-flex h-[44px] items-center gap-[8px] rounded-[12px] bg-gradient-to-r from-[#1b6dff] to-[#3f86ff] px-[18px] text-[12px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_6px_18px_rgba(27,109,255,0.32)] transition hover:from-[#155fe0] hover:to-[#2f78f5]"
        >
          Apply — show {found.toLocaleString()} {found === 1 ? "result" : "results"}
          <Kbd light>↵</Kbd>
        </button>
        {!fresh && (
          <button
            type="button"
            onClick={onInterpret}
            className="inline-flex h-[44px] items-center rounded-[12px] border border-[#dbe5ef] bg-white px-[14px] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#475467] transition hover:bg-[#f8fafc]"
          >
            Re-interpret
          </button>
        )}
        {showRefine && (
          <button
            data-tour="ai-inline-refine"
            type="button"
            onClick={onStartGuided}
            className="inline-flex h-[44px] items-center gap-[7px] rounded-[12px] border border-[#cdddff] bg-[#eef5ff] px-[14px] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#1d4ed8] transition hover:bg-[#e2eeff]"
          >
            Refine with a few questions
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
      {showRefine && (
        <p className="mt-[8px] text-[11px] text-[#94a3b8]">
          {found.toLocaleString()} matches is a lot — let AI ask a couple of questions to narrow it down.
        </p>
      )}
    </div>
  );
}

function NoMatchState({ chips, onClose }) {
  return (
    <div>
      <div className="flex items-center gap-[8px]">
        <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[#fff4ed] text-[#c2410c]">
          <SearchIcon className="h-[13px] w-[13px]" />
        </span>
        <p className="text-[13px] font-semibold text-[#0f172a]">
          No products match that description
        </p>
      </div>
      {chips.length > 0 && (
        <div className="mt-[10px] flex flex-wrap gap-[7px]">
          {chips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-[6px] rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-[10px] py-[5px] text-[11px] text-[#64748b]"
            >
              <span className="font-semibold uppercase tracking-[0.08em]">{chip.label}</span>
              <span className="font-mono">{chip.value}</span>
            </span>
          ))}
        </div>
      )}
      <p className="mt-[10px] text-[12px] leading-[1.6] text-[#64748b]">
        Try fewer constraints, a broader term, or remove a spec — then press{" "}
        <Kbd>Enter</Kbd> to re-interpret.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-[12px] inline-flex h-[40px] items-center rounded-[12px] border border-[#dbe5ef] bg-white px-[14px] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#475467] transition hover:bg-[#f8fafc]"
      >
        Edit prompt
      </button>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div>
      <div className="flex items-center gap-[8px]">
        <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[#fef2f2] text-[#b42318]">
          <WarnIcon className="h-[14px] w-[14px]" />
        </span>
        <p className="text-[13px] font-semibold text-[#0f172a]">AI search failed</p>
      </div>
      <p className="mt-[8px] text-[12px] leading-[1.6] text-[#b42318]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-[12px] inline-flex h-[40px] items-center rounded-[12px] bg-[#111827] px-[16px] text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-black"
      >
        Try again
      </button>
    </div>
  );
}

function GuidedView({ session, loading, onChip, onSkip, onShowResults, onStartOver, onRemoveLast }) {
  const meta = getGuidedQuestionMeta(session?.question_key);
  const suggestions = Array.isArray(session?.suggested_answers) ? session.suggested_answers : [];
  const activeFilters = Array.isArray(session?.display_filters) ? session.display_filters : [];
  const resultCount = Number(session?.result_count || 0);
  const userMessages = getGuidedUserMessages(session);
  const done = Boolean(session?.done);
  const canSkip = !loading && Boolean(session?.next_question) && !done;

  return (
    <div>
      <div className="flex items-center justify-between gap-[10px]">
        <div className="flex items-center gap-[8px]">
          <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[#edf4ff] text-[#1b6dff]">
            <SparkIcon className="h-[13px] w-[13px]" />
          </span>
          <p className="text-[13px] font-semibold text-[#0f172a]">Guided refine</p>
          <span className="rounded-full border border-[#dce5f1] bg-[#f8fbff] px-[8px] py-[3px] text-[11px] font-medium text-[#111827]">
            {resultCount.toLocaleString()} results
          </span>
        </div>
        <div className="flex items-center gap-[6px]">
          {userMessages.length > 0 && (
            <button
              type="button"
              onClick={onRemoveLast}
              disabled={loading}
              className="rounded-[8px] px-[8px] py-[5px] text-[11px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8] transition hover:text-[#0f172a] disabled:opacity-50"
            >
              Undo
            </button>
          )}
          <button
            type="button"
            onClick={onStartOver}
            disabled={loading}
            className="rounded-[8px] px-[8px] py-[5px] text-[11px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8] transition hover:text-[#0f172a] disabled:opacity-50"
          >
            Start over
          </button>
          <button
            type="button"
            onClick={onShowResults}
            className="rounded-[10px] bg-[#111827] px-[12px] py-[7px] text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-black"
          >
            Done
          </button>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-[12px] flex flex-wrap gap-[7px]">
          {activeFilters.map((filter) => (
            <span
              key={`${filter.key}-${String(filter.value)}`}
              className="inline-flex items-center gap-[6px] rounded-full border border-[#d8e5ff] bg-[#f3f8ff] px-[10px] py-[5px] text-[11px] text-[#1d4ed8]"
            >
              <span className="font-semibold uppercase tracking-[0.08em] text-[#3f86ff]">{filter.label}</span>
              <span className="font-mono text-[#1e3a8a]">{filter.value_display || filter.value}</span>
            </span>
          ))}
        </div>
      )}

      {done ? (
        <div className="mt-[12px] rounded-[14px] border border-[#d6f0df] bg-[#f5fbf7] px-[12px] py-[11px] text-[12px] leading-[1.6] text-[#166534]">
          The assistant has narrowed the catalog as far as it can. Click <span className="font-semibold">Done</span> to browse the {resultCount.toLocaleString()} results, or refine the prompt above.
        </div>
      ) : session?.next_question ? (
        <div className="mt-[12px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">Next question</p>
          <h4 className="mt-[5px] text-[15px] font-semibold tracking-[-0.01em] text-[#111827]">{meta.title}</h4>
          {meta.helper && <p className="mt-[4px] text-[12px] leading-[1.55] text-[#64748b]">{meta.helper}</p>}

          {suggestions.length > 0 && (
            <div className="mt-[10px] flex flex-wrap gap-[7px]">
              {suggestions.map((suggestion) => (
                <button
                  key={`${session.question_key}-${suggestion.value}`}
                  type="button"
                  onClick={() => onChip(suggestion)}
                  disabled={loading}
                  className="rounded-full border border-[#d7e3ee] bg-[#f8fbff] px-[12px] py-[7px] text-[12px] font-medium text-[#334155] transition hover:border-[#bfd2eb] hover:bg-white disabled:opacity-60"
                >
                  {suggestion.label}
                  {suggestion.count !== undefined && suggestion.count !== null && (
                    <span className="ml-[6px] text-[#98a2b3]">({suggestion.count})</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="mt-[12px] flex flex-wrap items-center gap-[10px]">
            <button
              type="button"
              onClick={onSkip}
              disabled={!canSkip}
              className="inline-flex h-[38px] items-center rounded-[10px] border border-[#dbe5ef] bg-white px-[12px] text-[11px] font-semibold uppercase tracking-[0.1em] text-[#475467] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Skip
            </button>
            <span className="text-[11px] text-[#94a3b8]">
              {loading ? "Applying…" : "or type your answer in the bar above and press Enter"}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-[12px] text-[12px] leading-[1.6] text-[#64748b]">
          {loading ? "Starting the assistant…" : "Type what you need in the bar above to begin."}
        </div>
      )}
    </div>
  );
}

/* ── Bits ───────────────────────────────────────────────────────────── */

function Kbd({ children, light = false }) {
  return (
    <kbd
      className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] px-[5px] text-[10px] font-semibold not-italic ${
        light
          ? "bg-white/20 text-white"
          : "border border-[#d8e1ea] bg-[#f8fafc] text-[#64748b]"
      }`}
    >
      {children}
    </kbd>
  );
}

function SparkIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5 14.2 8l5.3 1.8-5.3 1.8L12 17l-2.2-5.4-5.3-1.8L9.8 8 12 2.5Z" />
    </svg>
  );
}

function CheckIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="m5 13 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function WarnIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowReturn({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 10 4 15l5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4v7a4 4 0 0 1-4 4H4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
