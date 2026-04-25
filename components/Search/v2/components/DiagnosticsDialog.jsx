import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import V2SyncHealthCard from "../V2SyncHealthCard";

export default function DiagnosticsDialog({
  open,
  onClose,
  searchLatencyMs,
  suggestLatencyMs,
  queryDebug,
  searchState,
  found,
  aiSession,
  events,
}) {
  const recentEvents = Array.isArray(events) ? events.slice(0, 10) : [];

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
          <div className="flex min-h-full items-end justify-center p-[16px] md:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-[920px] rounded-[18px] bg-white p-[18px] shadow-xl">
                <div className="mb-[16px] flex items-start justify-between gap-[12px]">
                  <div>
                    <Dialog.Title className="text-[18px] font-semibold text-[#171717]">
                      V2 Diagnostics
                    </Dialog.Title>
                    <p className="text-[12px] text-[#666]">
                      Internal diagnostics for search quality, latency, and rollout support.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full bg-[#f3eee4] px-[10px] py-[6px] text-[12px] font-semibold text-[#5d503d]"
                  >
                    Close
                  </button>
                </div>

                <div className="grid gap-[16px] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                  <div className="space-y-[14px]">
                    <div className="rounded-[14px] border border-[#e7e0d4] bg-[#faf7f2] p-[14px]">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#7b6d58]">
                        Current search
                      </p>
                      <div className="mt-[10px] grid gap-[8px] text-[12px] text-[#444] md:grid-cols-2">
                        <MetricRow label="Query" value={searchState.q || "*"} />
                        <MetricRow label="Found" value={String(found)} />
                        <MetricRow label="Search latency" value={searchLatencyMs !== null ? `${searchLatencyMs} ms` : "N/A"} />
                        <MetricRow label="Suggest latency" value={suggestLatencyMs !== null ? `${suggestLatencyMs} ms` : "N/A"} />
                      </div>
                    </div>

                    <div className="rounded-[14px] border border-[#e7e0d4] bg-white p-[14px]">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#7b6d58]">
                        Query debug
                      </p>
                      <pre className="mt-[10px] max-h-[220px] overflow-auto rounded-[10px] bg-[#171717] p-[12px] text-[11px] text-[#f6f6f6]">
                        {JSON.stringify(queryDebug || {}, null, 2)}
                      </pre>
                    </div>

                    <div className="rounded-[14px] border border-[#e7e0d4] bg-white p-[14px]">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#7b6d58]">
                        AI session
                      </p>
                      <pre className="mt-[10px] max-h-[220px] overflow-auto rounded-[10px] bg-[#171717] p-[12px] text-[11px] text-[#f6f6f6]">
                        {JSON.stringify(aiSession || {}, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-[14px]">
                    <V2SyncHealthCard />
                    <div className="rounded-[14px] border border-[#e7e0d4] bg-white p-[14px]">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#7b6d58]">
                        Recent V2 events
                      </p>
                      <div className="mt-[10px] max-h-[260px] space-y-[8px] overflow-auto">
                        {recentEvents.length ? recentEvents.map((event, index) => (
                          <div key={`${event.ts}-${index}`} className="rounded-[10px] bg-[#faf7f2] p-[10px]">
                            <p className="text-[12px] font-semibold text-[#1b1b1b]">{event.type}</p>
                            <p className="text-[11px] text-[#7b6d58]">{event.ts}</p>
                            <pre className="mt-[6px] overflow-auto text-[11px] text-[#444]">
                              {JSON.stringify(event.payload || {}, null, 2)}
                            </pre>
                          </div>
                        )) : (
                          <p className="text-[12px] text-[#666]">No V2 diagnostic events recorded yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function MetricRow({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.4px] text-[#8a7f70]">{label}</p>
      <p className="mt-[2px] font-medium text-[#222]">{value}</p>
    </div>
  );
}
