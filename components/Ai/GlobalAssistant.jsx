import { useState } from "react";
import dynamic from "next/dynamic";

// App-wide AI colleague launcher (Part B / B4). Mounted globally in _app.js so the
// grounded Product Assistant is one tap away on every page. The AssistantDrawer is
// loaded lazily (only when first opened) to keep it off the critical path.
const AssistantDrawer = dynamic(() => import("@/components/Assistant/AssistantDrawer"), { ssr: false });

export default function GlobalAssistant() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const launch = () => { setMounted(true); setOpen(true); };

  return (
    <>
      <button
        type="button"
        onClick={launch}
        aria-label="Ask the AI assistant"
        className="group fixed bottom-[150px] right-[18px] z-[9998] flex items-center gap-2 rounded-full bg-gradient-to-br from-[#1b6dff] to-[#3f86ff] px-3.5 py-3 text-white shadow-[0_10px_30px_rgba(27,109,255,0.45)] transition-transform hover:scale-105 lg:bottom-[28px] lg:right-[28px]"
        style={{ animation: "ihgAiPulse 2.6s infinite" }}
      >
        <style>{`@keyframes ihgAiPulse{0%,100%{box-shadow:0 10px 30px rgba(27,109,255,.45),0 0 0 0 rgba(27,109,255,.35)}50%{box-shadow:0 10px 30px rgba(27,109,255,.45),0 0 0 10px rgba(27,109,255,0)}}`}</style>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2.5l1.9 4.6 4.6 1.9-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 2.5z" />
          <circle cx="18.5" cy="17.5" r="2.1" opacity="0.75" />
        </svg>
        <span className="hidden text-[13px] font-semibold sm:inline">Ask AI</span>
      </button>
      {mounted && <AssistantDrawer open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
