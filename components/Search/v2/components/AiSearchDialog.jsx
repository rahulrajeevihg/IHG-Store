import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

const EXAMPLES = [
  {
    title: "Spec-driven",
    prompt: "ip65 3000k downlights in stock under 500",
  },
  {
    title: "Strip and driver",
    prompt: "warm white led strip, 24v, waterproof",
  },
  {
    title: "Driver selection",
    prompt: "dimmable led driver 24v 150w in stock",
  },
  {
    title: "Accent lighting",
    prompt: "high lumen track lights above 3000lm",
  },
];

export default function AiSearchDialog({ open, onClose, aiPrompt, setAiPrompt, loading, onApply }) {
  const isPromptEmpty = aiPrompt.trim().length === 0;

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
          <div className="fixed inset-0 bg-[#09111f]/62" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-[12px] md:items-center md:p-[24px]">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 scale-[0.985]"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-[0.985]"
            >
              <Dialog.Panel data-tour="ai-search-dialog" className="relative w-full max-w-[820px] overflow-hidden rounded-[28px] border border-[#d8e1ea] bg-[#f7fafc] shadow-[0_28px_80px_rgba(3,8,20,0.32)]">
                <div className="absolute inset-x-0 top-0 h-[140px] bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.08),_transparent_52%),radial-gradient(circle_at_top_right,_rgba(27,109,255,0.16),_transparent_40%)]" />

                <div className="relative flex flex-col">
                  <header className="border-b border-[#e5edf4] bg-white/90 px-[22px] py-[20px] md:px-[28px] md:py-[24px]">
                    <div className="flex items-start justify-between gap-[16px]">
                      <div className="min-w-0">
                        <div className="flex items-center gap-[10px]">
                          <span className="inline-flex items-center rounded-full border border-[#d8e5ff] bg-[#edf4ff] px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
                            AI Search
                          </span>
                          <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-[#94a3b8] sm:inline">
                            Natural language to filters
                          </span>
                        </div>
                        <Dialog.Title className="mt-[14px] text-[28px] font-semibold tracking-[-0.04em] text-[#0f172a]">
                          Describe the product you need
                        </Dialog.Title>
                        <p className="mt-[8px] max-w-[620px] text-[14px] leading-[1.65] text-[#5b6472]">
                          Describe the lighting or electrical item you need in plain English. AI will translate your request into catalog terms, specs, stock intent, and sorting before updating the product list.
                        </p>
                      </div>

                      <button
                        data-tour="ai-search-dialog-close"
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] transition hover:border-[#111827] hover:text-[#111827]"
                        aria-label="Close"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  </header>

                  <div className="grid gap-[18px] px-[18px] py-[18px] md:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)] md:px-[24px] md:py-[22px]">
                    <section className="rounded-[24px] border border-[#dde6ee] bg-white p-[16px] shadow-[0_10px_24px_rgba(15,23,42,0.05)] md:p-[20px]">
                      <div className="flex flex-wrap items-center justify-between gap-[10px]">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                            Search brief
                          </p>
                          <h3 className="mt-[6px] text-[17px] font-semibold tracking-[-0.02em] text-[#111827]">
                            Prompt the catalog assistant
                          </h3>
                        </div>
                        <div className="rounded-full border border-[#e6edf4] bg-[#f8fafc] px-[10px] py-[5px] text-[11px] font-medium text-[#64748b]">
                          {aiPrompt.trim().length} characters
                        </div>
                      </div>

                      <div className="mt-[16px] rounded-[22px] border border-[#d8e1ea] bg-[#fbfdff] p-[12px] focus-within:border-[#111827] focus-within:shadow-[0_0_0_4px_rgba(17,24,39,0.05)]">
                        <textarea
                          data-tour="ai-search-dialog-input"
                          value={aiPrompt}
                          onChange={(event) => setAiPrompt(event.target.value)}
                          rows={7}
                          className="min-h-[180px] w-full resize-none bg-transparent px-[4px] py-[4px] text-[15px] leading-[1.7] text-[#111827] outline-none placeholder:text-[#9aa4b2]"
                          placeholder="Example: show me IP65 3000K spotlights in stock for hotel corridors under AED 500"
                        />
                      </div>

                      <div className="mt-[16px] flex flex-wrap items-center gap-[10px]">
                        <button
                          data-tour="ai-search-dialog-apply"
                          type="button"
                          onClick={onApply}
                          disabled={loading || isPromptEmpty}
                          className="inline-flex h-[46px] items-center rounded-[14px] bg-[#111827] px-[18px] text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading ? "Analyzing…" : "Run AI Search"}
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="inline-flex h-[46px] items-center rounded-[14px] border border-[#dbe5ef] bg-white px-[16px] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#475467] transition hover:bg-[#f8fafc]"
                        >
                          Cancel
                        </button>
                        {!isPromptEmpty && (
                          <button
                            type="button"
                            onClick={() => setAiPrompt("")}
                            className="inline-flex h-[46px] items-center rounded-[14px] px-[8px] text-[12px] font-semibold text-[#94a3b8] transition hover:text-[#111827]"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </section>

                    <aside data-tour="ai-search-dialog-examples" className="space-y-[16px]">
                      <section className="rounded-[24px] border border-[#dde6ee] bg-white p-[16px] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                        <div className="flex items-center gap-[10px]">
                          <span className="grid h-[34px] w-[34px] place-items-center rounded-[12px] bg-[#edf4ff] text-[#1d4ed8]">
                            <SparkIcon />
                          </span>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                              What AI does
                            </p>
                            <p className="mt-[4px] text-[14px] font-semibold text-[#111827]">
                              Converts your request into search intent
                            </p>
                          </div>
                        </div>

                        <div className="mt-[14px] space-y-[10px]">
                          <HelperRow label="Lighting specs" value="IP rating, wattage, CCT, beam angle, voltage" />
                          <HelperRow label="Electrical intent" value="drivers, dimming, controls, stock, budget" />
                          <HelperRow label="Catalog behavior" value="filters, sort, and lighting keyword cleanup" />
                        </div>
                      </section>

                      <section className="rounded-[24px] border border-[#dde6ee] bg-white p-[16px] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                        <div className="flex items-center justify-between gap-[10px]">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                              Example prompts
                            </p>
                            <p className="mt-[4px] text-[14px] font-semibold text-[#111827]">
                              Start from a curated pattern
                            </p>
                          </div>
                        </div>

                        <div className="mt-[14px] space-y-[10px]">
                          {EXAMPLES.map((example) => (
                            <button
                              key={example.prompt}
                              type="button"
                              onClick={() => setAiPrompt(example.prompt)}
                              className="group block w-full rounded-[18px] border border-[#e6edf4] bg-[#fbfdff] px-[14px] py-[13px] text-left transition hover:border-[#bfd2eb] hover:bg-white hover:shadow-[0_10px_18px_rgba(15,23,42,0.06)]"
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                                {example.title}
                              </p>
                              <p className="mt-[6px] text-[13px] leading-[1.55] text-[#334155] transition group-hover:text-[#111827]">
                                {example.prompt}
                              </p>
                            </button>
                          ))}
                        </div>
                      </section>
                    </aside>
                  </div>

                  <footer className="flex flex-wrap items-center justify-between gap-[12px] border-t border-[#e5edf4] bg-white px-[22px] py-[14px] md:px-[28px]">
                    <p className="text-[12px] text-[#667085]">
                      AI results will replace the current list filters and search state.
                    </p>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#98a2b3]">
                      Best for lighting and electrical sourcing
                    </p>
                  </footer>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function HelperRow({ label, value }) {
  return (
    <div className="rounded-[16px] border border-[#edf2f7] bg-[#f9fbfd] px-[12px] py-[11px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
        {label}
      </p>
      <p className="mt-[5px] text-[12px] leading-[1.55] text-[#475467]">
        {value}
      </p>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5 14.2 8l5.3 1.8-5.3 1.8L12 17l-2.2-5.4-5.3-1.8L9.8 8 12 2.5Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}
