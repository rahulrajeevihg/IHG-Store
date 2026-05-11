import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { getGuidedQuestionMeta, getGuidedUserMessages } from "@/libs/aiGuidedSearch";

export default function AiGuidedAssistantDialog({
  open,
  onClose,
  session,
  inputValue,
  onInputChange,
  onSubmit,
  onChipClick,
  onSkip,
  onStartOver,
  onEndChat,
  onShowResults,
  onRemoveLastAnswer,
  loading,
  title = "AI Guided Product Assistant",
  subtitle = "Tell the assistant what you need, and it will narrow the catalog step by step.",
  secondaryActionLabel,
  onSecondaryAction,
}) {
  const meta = getGuidedQuestionMeta(session?.question_key);
  const messages = Array.isArray(session?.messages) ? session.messages : [];
  const suggestions = Array.isArray(session?.suggested_answers) ? session.suggested_answers : [];
  const activeFilters = Array.isArray(session?.display_filters) ? session.display_filters : [];
  const resultCount = Number(session?.result_count || 0);
  const userMessages = getGuidedUserMessages(session);
  const canRemoveLastAnswer = !loading && userMessages.length > 0;
  const canSkip = !loading && Boolean(session?.next_question) && !session?.done;
  const primaryFilter =
    activeFilters.find((entry) => ["Category", "Product Type", "Brand"].includes(entry?.label)) ||
    activeFilters[0] ||
    null;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#09111f]/45" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-end md:items-stretch">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 md:translate-x-6 md:translate-y-0"
              enterTo="opacity-100 translate-y-0 md:translate-x-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 md:translate-x-0"
              leaveTo="opacity-0 translate-y-4 md:translate-x-6 md:translate-y-0"
            >
              <Dialog.Panel className="flex h-[92vh] w-full max-w-[780px] flex-col overflow-hidden rounded-t-[28px] border border-[#d9e2ec] bg-[#f4f7fb] shadow-[0_32px_80px_rgba(3,8,20,0.22)] md:h-screen md:rounded-none md:border-y-0 md:border-r-0 md:rounded-l-[28px]">
                <header className="border-b border-[#e4ebf2] bg-white px-[20px] py-[18px] md:px-[24px]">
                  <div className="flex items-start justify-between gap-[14px]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-[10px]">
                        <span className="inline-flex items-center rounded-full border border-[#d8e5ff] bg-[#edf4ff] px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
                          Guided Search
                        </span>
                        <MetricPill label="Live results" value={resultCount.toLocaleString()} tone="dark" />
                        <MetricPill label="Active filters" value={String(activeFilters.length)} />
                        {primaryFilter && (
                          <MetricPill
                            label={primaryFilter.label}
                            value={String(primaryFilter.value_display || primaryFilter.value || "").slice(0, 24)}
                          />
                        )}
                      </div>
                      <Dialog.Title className="mt-[12px] text-[24px] font-semibold tracking-[-0.04em] text-[#0f172a]">
                        {title}
                      </Dialog.Title>
                      <p className="mt-[6px] max-w-[560px] text-[13px] leading-[1.65] text-[#5b6472]">
                        {subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] transition hover:border-[#111827] hover:text-[#111827]"
                      aria-label="Close guided assistant"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mt-[16px] grid gap-[10px] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="rounded-[18px] border border-[#e5edf4] bg-[#f8fbff] px-[14px] py-[12px]">
                      <div className="flex items-center justify-between gap-[10px]">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                            Current narrowing plan
                          </p>
                          <p className="mt-[5px] text-[13px] leading-[1.6] text-[#475467]">
                            {session?.done
                              ? "The assistant has enough structure for now. You can browse results or reopen to refine further."
                              : session?.next_question
                                ? `Next best filter: ${meta.title}`
                                : "Start with the broad product need and the assistant will build the filter path."}
                          </p>
                        </div>
                        {session?.next_question && !session?.done && (
                          <button
                            type="button"
                            onClick={onShowResults || onEndChat}
                            className="hidden rounded-[12px] border border-[#d8e1ea] bg-white px-[14px] py-[10px] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#344054] transition hover:border-[#111827] hover:text-[#111827] sm:inline-flex"
                          >
                            Show results now
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-[10px]">
                      <button
                        type="button"
                        onClick={onStartOver}
                        className="inline-flex h-[40px] items-center rounded-[12px] border border-[#dbe5ef] bg-white px-[14px] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#475467] transition hover:bg-[#f8fafc]"
                      >
                        Start over
                      </button>
                      {onRemoveLastAnswer && (
                        <button
                          type="button"
                          onClick={onRemoveLastAnswer}
                          disabled={!canRemoveLastAnswer}
                          className="inline-flex h-[40px] items-center rounded-[12px] border border-[#dbe5ef] bg-white px-[14px] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#475467] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remove last answer
                        </button>
                      )}
                      {onSecondaryAction && secondaryActionLabel && (
                        <button
                          type="button"
                          onClick={onSecondaryAction}
                          className="inline-flex h-[40px] items-center rounded-[12px] px-[4px] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1d4ed8] transition hover:text-[#1e3a8a]"
                        >
                          {secondaryActionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-[18px] md:px-[22px]">
                  <div className="space-y-[14px]">
                    <section className="rounded-[22px] border border-[#dbe5ef] bg-white px-[16px] py-[16px] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                      <div className="flex flex-wrap items-start justify-between gap-[12px]">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                            Applied filters
                          </p>
                          <p className="mt-[6px] text-[13px] leading-[1.6] text-[#667085]">
                            These are the filters the assistant has already applied to the catalog behind this drawer.
                          </p>
                        </div>
                        <div className="rounded-[14px] border border-[#e5edf4] bg-[#f8fafc] px-[12px] py-[10px] text-right">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">Result count</div>
                          <div className="mt-[4px] text-[18px] font-semibold tracking-[-0.03em] text-[#0f172a]">
                            {resultCount.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="mt-[14px] flex flex-wrap gap-[8px]">
                        {activeFilters.length > 0 ? (
                          activeFilters.map((filter) => (
                            <span
                              key={`${filter.key}-${String(filter.value)}`}
                              className="inline-flex items-center gap-[8px] rounded-full border border-[#d7e3ee] bg-[#f8fbff] px-[12px] py-[8px] text-[12px] font-medium text-[#334155]"
                            >
                              <span className="text-[#98a2b3]">{filter.label}</span>
                              <span className="text-[#0f172a]">{filter.value_display || filter.value}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[13px] text-[#98a2b3]">No filters applied yet.</span>
                        )}
                      </div>
                    </section>

                    <section className="rounded-[22px] border border-[#dbe5ef] bg-[#fbfdff] px-[16px] py-[16px] shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                      <div className="flex items-center justify-between gap-[10px]">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                            Conversation
                          </p>
                          <p className="mt-[6px] text-[13px] leading-[1.6] text-[#667085]">
                            Each answer narrows the result set immediately.
                          </p>
                        </div>
                        {session?.explanation && (
                          <div className="max-w-[240px] rounded-[14px] border border-[#e6edf4] bg-white px-[12px] py-[10px] text-[11px] leading-[1.6] text-[#667085]">
                            {session.explanation}
                          </div>
                        )}
                      </div>

                      <div className="mt-[14px] space-y-[12px]">
                        {messages.length === 0 ? (
                          <div className="rounded-[18px] border border-dashed border-[#dbe5ef] bg-white px-[18px] py-[18px] text-[13px] leading-[1.7] text-[#667085]">
                            Start by telling the assistant what you need. It will keep narrowing the catalog with one targeted question at a time.
                          </div>
                        ) : (
                          messages.map((message) => (
                            <MessageBubble key={message.id} role={message.role} content={message.content} />
                          ))
                        )}
                      </div>
                    </section>

                    {session?.next_question && !session?.done && (
                      <section className="rounded-[22px] border border-[#dce7f0] bg-white px-[16px] py-[16px] shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                        <div className="flex flex-wrap items-start justify-between gap-[12px]">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                              Next question
                            </p>
                            <h3 className="mt-[8px] text-[17px] font-semibold tracking-[-0.02em] text-[#111827]">
                              {meta.title}
                            </h3>
                            <p className="mt-[6px] text-[13px] leading-[1.6] text-[#667085]">
                              {meta.helper}
                            </p>
                          </div>

                          <div className="rounded-[14px] border border-[#e6edf4] bg-[#f8fbff] px-[12px] py-[10px] text-[12px] leading-[1.5] text-[#475467]">
                            <div className="font-semibold text-[#0f172a]">Why this question?</div>
                            <div className="mt-[4px] max-w-[220px]">It looks like the cleanest remaining filter to reduce the current result set without over-constraining it.</div>
                          </div>
                        </div>

                        {suggestions.length > 0 && (
                          <div className="mt-[14px] flex flex-wrap gap-[8px]">
                            {suggestions.map((suggestion) => (
                              <button
                                key={`${session.question_key}-${suggestion.value}`}
                                type="button"
                                onClick={() => onChipClick(suggestion)}
                                disabled={loading}
                                className="rounded-full border border-[#d7e3ee] bg-[#f8fbff] px-[12px] py-[8px] text-[12px] font-medium text-[#334155] transition hover:border-[#bfd2eb] hover:bg-white disabled:opacity-60"
                              >
                                {suggestion.label}
                                {suggestion.count !== undefined && suggestion.count !== null && (
                                  <span className="ml-[6px] text-[#98a2b3]">({suggestion.count})</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="mt-[14px] flex flex-wrap items-center gap-[10px]">
                          <button
                            type="button"
                            onClick={onSkip}
                            disabled={!canSkip}
                            className="inline-flex h-[40px] items-center rounded-[12px] border border-[#dbe5ef] bg-white px-[14px] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#475467] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Skip this question
                          </button>
                          <button
                            type="button"
                            onClick={onShowResults || onEndChat}
                            className="inline-flex h-[40px] items-center rounded-[12px] px-[4px] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3] transition hover:text-[#111827]"
                          >
                            Show results now
                          </button>
                        </div>
                      </section>
                    )}

                    {session?.done && (
                      <div className="rounded-[22px] border border-[#d6f0df] bg-[#f5fbf7] px-[16px] py-[16px] text-[13px] leading-[1.7] text-[#166534]">
                        The assistant has narrowed the catalog as much as it can for now. You can keep the filters, ask another follow-up, remove the last answer, or start a fresh guided search.
                      </div>
                    )}
                  </div>
                </div>

                <footer className="border-t border-[#e5edf4] bg-white px-[18px] py-[16px] md:px-[22px]">
                  <div className="rounded-[20px] border border-[#d8e1ea] bg-[#fbfdff] p-[12px]">
                    <textarea
                      value={inputValue}
                      onChange={(event) => onInputChange(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          onSubmit();
                        }
                      }}
                      rows={3}
                      placeholder={meta.placeholder}
                      className="min-h-[86px] w-full resize-none bg-transparent px-[4px] py-[4px] text-[14px] leading-[1.65] text-[#111827] outline-none placeholder:text-[#9aa4b2]"
                    />
                  </div>

                  <div className="mt-[12px] flex flex-wrap items-center justify-between gap-[10px]">
                    <p className="text-[12px] leading-[1.6] text-[#98a2b3]">
                      Press <span className="font-semibold text-[#667085]">Enter</span> to answer, or <span className="font-semibold text-[#667085]">Shift + Enter</span> for a new line.
                    </p>

                    <div className="flex items-center gap-[10px]">
                      <button
                        type="button"
                        onClick={onSubmit}
                        disabled={loading || !inputValue.trim()}
                        className="inline-flex h-[44px] items-center rounded-[14px] bg-[#111827] px-[18px] text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? "Applying…" : messages.length ? "Send answer" : "Start assistant"}
                      </button>
                    </div>
                  </div>
                </footer>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function MetricPill({ label, value, tone = "default" }) {
  return (
    <span
      className={`rounded-full border px-[10px] py-[5px] text-[11px] font-medium ${
        tone === "dark"
          ? "border-[#dce5f1] bg-[#f8fbff] text-[#111827]"
          : "border-[#e6edf4] bg-[#f8fafc] text-[#64748b]"
      }`}
    >
      <span className="text-[#98a2b3]">{label}</span>
      <span className="ml-[6px] text-current">{value}</span>
    </span>
  );
}

function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-[22px] px-[16px] py-[13px] text-[13px] leading-[1.7] shadow-[0_8px_18px_rgba(15,23,42,0.04)] ${
          isUser
            ? "rounded-br-[8px] bg-[#111827] text-white"
            : "rounded-bl-[8px] border border-[#dde6ee] bg-white text-[#334155]"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
