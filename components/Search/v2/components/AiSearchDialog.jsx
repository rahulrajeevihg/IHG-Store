import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

const EXAMPLES = [
  "ip65 3000k downlights in stock under 500",
  "warm white led strip, 24v, waterproof",
  "obsolete mounting brackets still in stock",
  "high lumen track lights above 3000lm",
];

export default function AiSearchDialog({ open, onClose, aiPrompt, setAiPrompt, loading, onApply }) {
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
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-[12px] md:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-[640px] border border-[#111] bg-white">
                <div className="flex items-start justify-between border-b border-[#e5e5e5] px-[20px] py-[16px]">
                  <div className="flex items-start gap-[10px]">
                    <svg className="mt-[2px] h-[16px] w-[16px] text-[#1b6dff]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l1.9 5.2L19 9l-5.1 1.8L12 16l-1.9-5.2L5 9l5.1-1.8L12 2z" />
                    </svg>
                    <div>
                      <Dialog.Title className="text-[15px] font-semibold text-[#111]">
                        Ask AI to search
                      </Dialog.Title>
                      <p className="mt-[2px] text-[12px] text-[#6b7280]">
                        Describe what you need — AI maps it to filters, sort, and a query.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-[20px] leading-none text-[#111]"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="px-[20px] py-[16px]">
                  <textarea
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    rows={4}
                    className="w-full border border-[#e5e5e5] bg-white px-[12px] py-[10px] text-[13px] text-[#111] outline-none focus:border-[#111]"
                    placeholder="Example: show me ip65 3000k downlights in stock under 500"
                  />
                  <p className="mt-[10px] text-[10px] font-medium uppercase tracking-[0.14em] text-[#9ca3af]">
                    Try one of these
                  </p>
                  <div className="mt-[6px] flex flex-wrap gap-[6px]">
                    {EXAMPLES.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setAiPrompt(example)}
                        className="border border-[#e5e5e5] bg-white px-[8px] py-[5px] text-[11px] text-[#6b7280] hover:border-[#111] hover:text-[#111]"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#e5e5e5] bg-[#fafafa] px-[20px] py-[12px]">
                  <p className="text-[11px] text-[#6b7280]">
                    Results will replace the current search.
                  </p>
                  <button
                    type="button"
                    onClick={onApply}
                    disabled={loading}
                    className="bg-[#111] px-[16px] py-[9px] text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Applying…" : "Apply AI search"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
