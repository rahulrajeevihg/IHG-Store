export default function AiGuidedAssistantLauncher({ onClick, pending = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed bottom-[154px] right-[18px] z-[121] inline-flex min-w-[56px] items-center gap-3 rounded-[18px] border border-[#dbe5ef] bg-white px-3 py-3 shadow-[0_18px_32px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_38px_rgba(15,23,42,0.18)] md:right-[20px] md:min-w-[190px] md:px-4 ${className}`}
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#111827] text-white">
        <AssistantIcon />
        {pending && (
          <span className="absolute -right-1 -top-1 inline-flex h-[10px] w-[10px] rounded-full bg-[#1d4ed8]" />
        )}
      </span>

      <span className="hidden min-w-0 text-left md:block">
        <span className="block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
          AI Assistant
        </span>
        <span className="mt-1 block text-[14px] font-semibold text-[#111827]">
          Guided product chat
        </span>
        <span className="mt-0.5 block text-[12px] text-[#667085]">
          Ask for products naturally
        </span>
      </span>
    </button>
  );
}

function AssistantIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M12 3.75a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.5 19.25a5.5 5.5 0 0 1 11 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="17.75" cy="6.25" r="2.25" fill="currentColor" opacity="0.18" />
      <path d="M17.75 4.75v3m-1.5-1.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
