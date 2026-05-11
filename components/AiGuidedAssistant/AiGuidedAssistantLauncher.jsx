export default function AiGuidedAssistantLauncher({ onClick, pending = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed bottom-[154px] right-[18px] z-[121] inline-flex min-w-[56px] items-center gap-3 rounded-[18px] border border-[#dbe5ef] bg-white px-3 py-3 shadow-[0_18px_32px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_38px_rgba(15,23,42,0.18)] md:right-[20px] md:min-w-[190px] md:px-4 ${className}`}
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-white">
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
    <img
      src="https://erp.ihgind.com/files/intelligent.gif"
      alt="AI Assistant"
      className="h-11 w-11 rounded-[12px] object-cover"
    />
  );
}
