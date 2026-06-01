import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import Image from "next/image";
import { toast } from "react-toastify";
import { check_Image, product_assistant_chat, insert_cart_items } from "@/libs/api";

// Polished slide-over chat for the grounded Product Assistant. Brand AI accent is
// the app's blue gradient (#1b6dff -> #3f86ff). Sends running history to
// product_assistant_chat; renders reply (markdown) + grounded product cards with
// inline actions. Features: typewriter reveal, voice input, copy, quick replies,
// session persistence, citations, action buttons.

const HISTORY_KEY = "ihg_assistant_history_v1";
const SUGGESTIONS = [
  { icon: "🔌", text: "Is a driver required for LB2111.W.830.WWH.36?" },
  { icon: "⚡", text: "Find a suitable driver for LB2100.W.830.WBK.36" },
  { icon: "🔁", text: "Alternative of LB2100.W.830.WBK.36" },
  { icon: "💡", text: "Cheapest 3000K IP65 spotlight in stock" },
];
const QUICK_REPLIES = ["In stock only", "Show cheaper", "Find a driver for the first one", "Add the first to my quote"];

/* ── Minimal, safe Markdown -> React (no deps, no dangerouslySetInnerHTML) ── */
function renderInline(text, kp) {
  const nodes = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) nodes.push(<strong key={`${kp}b${i}`} className="font-semibold text-[#0f172a]">{m[2]}</strong>);
    else if (m[3] !== undefined) nodes.push(<em key={`${kp}i${i}`}>{m[3]}</em>);
    else if (m[4] !== undefined) nodes.push(<code key={`${kp}c${i}`} className="rounded bg-[#eef2f7] px-1 py-0.5 font-mono text-[11px]">{m[4]}</code>);
    last = m.index + m[0].length; i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function MarkdownBody({ text }) {
  const lines = String(text || "").split(/\r?\n/);
  const blocks = [];
  let list = null, table = null;
  const flushList = () => {
    if (list && list.length) {
      blocks.push(
        <ul key={`ul${blocks.length}`} className="my-1 ml-1 space-y-1">
          {list.map((it, idx) => (
            <li key={idx} className="flex gap-1.5"><span className="mt-[7px] h-1 w-1 flex-none rounded-full bg-[#1b6dff]" /><span>{renderInline(it, `li${blocks.length}_${idx}`)}</span></li>
          ))}
        </ul>
      );
    }
    list = null;
  };
  const flushTable = () => {
    if (table && table.length) {
      const [head, ...rows] = table;
      blocks.push(
        <div key={`tb${blocks.length}`} className="my-1.5 overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead><tr>{head.map((c, i) => <th key={i} className="border border-[#e8ecf3] bg-[#f5f8fd] px-2 py-1 text-left font-semibold text-[#0f172a]">{renderInline(c, `th${i}`)}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} className="border border-[#e8ecf3] px-2 py-1 text-[#334155]">{renderInline(c, `td${ri}_${ci}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    }
    table = null;
  };
  const splitRow = (l) => l.replace(/^\||\|$/g, "").split("|").map((s) => s.trim());
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    const isTableRow = line.startsWith("|") && line.endsWith("|") && line.includes("|");
    const isDivider = /^\|?[\s:-]+\|[\s:|-]*$/.test(line) && line.includes("-");
    if (isTableRow && !isDivider) {
      flushList(); if (!table) table = []; table.push(splitRow(line)); return;
    }
    if (isDivider && table) return; // skip the |---| separator
    flushTable();
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) { if (!list) list = []; list.push(bullet[1]); }
    else if (line === "") { flushList(); }
    else { flushList(); blocks.push(<p key={`p${idx}`} className="my-0.5">{renderInline(line, `p${idx}`)}</p>); }
  });
  flushList(); flushTable();
  return <>{blocks}</>;
}

function AiGlyph({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2.5l1.9 4.6 4.6 1.9-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 2.5z" fill="currentColor" />
      <circle cx="18.5" cy="17.5" r="2.2" fill="currentColor" opacity="0.7" />
      <circle cx="5.5" cy="18" r="1.4" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function ProductChip({ item, onOpen, onAddToCart, onFindDriver, onAlternatives }) {
  const image = check_Image(item?.website_image_url || item?.image || "");
  const inStock = Number(item?.stock || 0) > 0;
  return (
    <div className="group flex w-[186px] min-w-[186px] flex-none snap-start flex-col rounded-[14px] border border-[#e8ecf3] bg-white p-2 transition-all duration-200 hover:border-[#1b6dff] hover:shadow-[0_10px_28px_rgba(27,109,255,0.16)]">
      <button type="button" onClick={() => onOpen(item)} className="text-left">
        <div className="relative mb-1.5 h-[78px] w-full overflow-hidden rounded-[10px] bg-gradient-to-br from-[#f7f9fc] to-[#eef3fb]">
          {!!image && <Image src={image} alt={item?.item_code || "item"} fill className="object-contain p-2 transition-transform duration-300 group-hover:scale-105" />}
        </div>
        <p className="line-clamp-1 font-mono text-[10px] font-semibold text-[#0f172a]">{item?.item_code || "-"}</p>
        <p className="line-clamp-2 min-h-[28px] text-[10px] leading-[1.3] text-[#64748b]">{item?.item_name || "-"}</p>
        {item?.match_reason ? <p className="mt-0.5 line-clamp-1 rounded-[5px] bg-[#eef5ff] px-1.5 py-0.5 text-[9px] font-medium text-[#1b6dff]">✓ {item.match_reason}</p> : null}
        <div className="mt-1.5 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 text-[9px] font-semibold ${inStock ? "text-[#15803d]" : "text-[#b91c1c]"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
            {inStock ? `${Number(item?.stock || 0)} in stock` : "Out of stock"}
          </span>
          <span className="text-[10px] font-bold text-[#0f172a]">{Number(item?.rate || 0).toFixed(2)}</span>
        </div>
      </button>
      <div className="mt-1.5 flex items-center gap-1">
        <button type="button" onClick={() => onAddToCart(item)} title="Add to quote" className="flex-1 rounded-[7px] bg-[#0f172a] px-2 py-1 text-[9.5px] font-semibold text-white transition hover:bg-[#1e293b]">+ Quote</button>
        <button type="button" onClick={() => onFindDriver(item)} title="Find driver" className="rounded-[7px] border border-[#e2e8f0] px-2 py-1 text-[9.5px] font-semibold text-[#475569] transition hover:border-[#1b6dff] hover:text-[#1b6dff]">Driver</button>
        <button type="button" onClick={() => onAlternatives(item)} title="Alternatives" className="rounded-[7px] border border-[#e2e8f0] px-2 py-1 text-[9.5px] font-semibold text-[#475569] transition hover:border-[#1b6dff] hover:text-[#1b6dff]">Alt</button>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#1b6dff]" style={{ animation: `aiBounce 1.2s ${i * 0.16}s infinite ease-in-out` }} />)}
    </div>
  );
}

export default function AssistantDrawer({ open, onClose, seedMessage = "" }) {
  const router = useRouter();
  const [messages, setMessages] = useState([]); // {role, content, products?, displayed?, cited?}
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const seededRef = useRef(false);
  const recognitionRef = useRef(null);

  /* Scroll-lock while open */
  useEffect(() => {
    if (typeof document === "undefined" || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => setMounted(true));
    return () => { document.body.style.overflow = prev; setMounted(false); cancelAnimationFrame(id); };
  }, [open]);

  /* Restore last session on open */
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      if (Array.isArray(saved) && saved.length) setMessages(saved.map((m) => ({ ...m, displayed: m.content })));
    } catch (_) {}
  }, [open]);

  /* Persist session */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const slim = messages.slice(-20).map(({ role, content, products }) => ({ role, content, products: products || [] }));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(slim));
    } catch (_) {}
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  /* Typewriter reveal of the latest assistant message */
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || last.displayed === last.content) return;
    let i = last.displayed ? last.displayed.length : 0;
    const full = last.content;
    const step = Math.max(2, Math.round(full.length / 90)); // finish in ~90 ticks
    const timer = setInterval(() => {
      i = Math.min(full.length, i + step);
      setMessages((prev) => {
        const copy = [...prev];
        const idx = copy.length - 1;
        if (copy[idx] && copy[idx].role === "assistant") copy[idx] = { ...copy[idx], displayed: full.slice(0, i) };
        return copy;
      });
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      if (i >= full.length) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const autoGrow = (el) => { if (!el) return; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; };

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const next = [...messages, { role: "user", content: msg, displayed: msg }];
    setMessages(next);
    setSending(true);
    try {
      const res = await product_assistant_chat(msg, history);
      const cited = (res.tool_trace || []).some((t) => ["search_products", "get_product", "find_alternatives", "find_driver", "check_driver_requirement"].includes(t.tool));
      setMessages([...next, { role: "assistant", content: res.reply || "(no response)", displayed: "", products: res.products || [], cited }]);
      if (Array.isArray(res.cart_added) && res.cart_added.length) {
        toast.success(`Added ${res.cart_added.length} item(s) to your quote`);
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (e) {
      setMessages([...next, { role: "assistant", content: "Sorry — I couldn't reach the assistant. Please try again.", displayed: "", products: [], error: true }]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (open && seedMessage && !seededRef.current) { seededRef.current = true; send(seedMessage); }
    if (!open) seededRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedMessage]);

  /* Voice input via Web Speech API (graceful if unsupported) */
  const toggleVoice = () => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.info("Voice input isn't supported in this browser"); return; }
    if (listening && recognitionRef.current) { recognitionRef.current.stop(); return; }
    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false;
    rec.onresult = (e) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join("");
      setInput(t); autoGrow(taRef.current);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec; setListening(true); rec.start();
  };

  const openProduct = (item) => { if (item?.item_code) { router.push(`/pr/${encodeURIComponent(item.item_code)}`); onClose?.(); } };
  const addToCart = async (item) => {
    try {
      const r = await insert_cart_items({ item_code: item.item_code, qty: 1 });
      if ((r || {}).status === "success") { toast.success(`Added ${item.item_code} to quote`); window.dispatchEvent(new Event("cart-updated")); }
      else toast.error((r || {}).message || "Could not add to cart");
    } catch (_) { toast.error("Could not add to cart"); }
  };
  const findDriver = (item) => send(`Find a suitable driver for ${item.item_code}`);
  const alternatives = (item) => send(`Show alternatives for ${item.item_code}`);

  const copyMessage = (text) => { try { navigator.clipboard.writeText(text); toast.success("Copied"); } catch (_) {} };
  const resetChat = () => { setMessages([]); setInput(""); try { localStorage.removeItem(HISTORY_KEY); } catch (_) {} };

  if (!open || typeof document === "undefined") return null;
  const lastAssistantHasProducts = (() => { const a = [...messages].reverse().find((m) => m.role === "assistant"); return a && a.products && a.products.length > 0; })();

  return createPortal(
    <div className="fixed inset-0 z-[10001]">
      <style>{`
        @keyframes aiBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}
        @keyframes aiPulse{0%,100%{box-shadow:0 0 0 0 rgba(27,109,255,.35)}50%{box-shadow:0 0 0 6px rgba(27,109,255,0)}}
        @keyframes aiMsgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .ai-msg{animation:aiMsgIn .22s ease-out both}
        .ai-panel{transition:transform .28s cubic-bezier(.22,1,.36,1)}
        @keyframes micPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
      `}</style>

      <div className={`absolute inset-0 bg-[#0b1220]/45 backdrop-blur-[2px] transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`} onClick={() => onClose?.()} />

      <div className="ai-panel absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col bg-[#f7f9fc] shadow-[0_0_60px_rgba(15,23,42,0.35)]" style={{ transform: mounted ? "translateX(0)" : "translateX(100%)" }}>
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#155fe0] via-[#1b6dff] to-[#3f86ff] px-4 py-3.5 text-white">
          <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/15 ring-1 ring-white/25" style={{ animation: "aiPulse 2.6s infinite" }}><AiGlyph size={18} /></div>
              <div>
                <p className="text-[14.5px] font-semibold leading-tight">Product Assistant</p>
                <p className="flex items-center gap-1.5 text-[11px] text-white/80"><span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" /> Live catalog · grounded answers</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button type="button" onClick={resetChat} title="New chat" className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              )}
              <button type="button" onClick={() => onClose?.()} title="Close" className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {messages.length === 0 && (
            <div className="ai-msg">
              <div className="mb-4 flex flex-col items-center text-center">
                <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1b6dff] to-[#3f86ff] text-white shadow-[0_8px_22px_rgba(27,109,255,0.35)]"><AiGlyph size={24} /></div>
                <p className="text-[15px] font-semibold text-[#0f172a]">How can I help you source?</p>
                <p className="mt-1 max-w-[300px] text-[12px] leading-[1.5] text-[#64748b]">Ask about drivers, alternatives, specs or stock — or paste a customer enquiry. Answered from the live catalog, never guessed.</p>
              </div>
              <div className="space-y-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s.text} type="button" onClick={() => send(s.text)} className="flex w-full items-center gap-2.5 rounded-[12px] border border-[#e8ecf3] bg-white px-3 py-2.5 text-left text-[12.5px] text-[#334155] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#1b6dff] hover:shadow-[0_8px_20px_rgba(27,109,255,0.12)]">
                    <span className="text-[15px]">{s.icon}</span><span className="flex-1">{s.text}</span><span className="text-[#cbd5e1]">›</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => {
            const isUser = m.role === "user";
            const body = isUser ? m.content : (m.displayed ?? m.content);
            return (
              <div key={i} className={`ai-msg flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
                <div className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-bold ${isUser ? "bg-[#0f172a] text-white" : "bg-gradient-to-br from-[#1b6dff] to-[#3f86ff] text-white"}`}>{isUser ? "You" : <AiGlyph size={14} />}</div>
                <div className={`min-w-0 ${isUser ? "max-w-[82%]" : "w-full max-w-[88%]"}`}>
                  <div className={`group/msg relative rounded-[14px] px-3.5 py-2.5 text-[12.5px] leading-[1.55] shadow-[0_1px_2px_rgba(15,23,42,0.05)] ${isUser ? "whitespace-pre-wrap rounded-tr-[4px] bg-[#0f172a] text-white" : `rounded-tl-[4px] border bg-white text-[#1e293b] ${m.error ? "border-[#fecaca]" : "border-[#e8ecf3]"}`}`}>
                    {isUser ? body : <MarkdownBody text={body} />}
                    {!isUser && body === m.content && (
                      <button type="button" onClick={() => copyMessage(m.content)} title="Copy" className="absolute right-1.5 top-1.5 rounded-md p-1 text-[#cbd5e1] opacity-0 transition group-hover/msg:opacity-100 hover:bg-[#f1f5f9] hover:text-[#475569]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></svg>
                      </button>
                    )}
                  </div>
                  {!isUser && m.cited && body === m.content && (
                    <p className="mt-1 flex items-center gap-1 pl-1 text-[9.5px] text-[#94a3b8]"><span className="h-1 w-1 rounded-full bg-[#22c55e]" /> from live catalog · stock &amp; price at query time</p>
                  )}
                  {!isUser && Array.isArray(m.products) && m.products.length > 0 && (
                    <div className="mt-2.5 flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {m.products.map((p, j) => <ProductChip key={`${p.item_code}-${j}`} item={p} onOpen={openProduct} onAddToCart={addToCart} onFindDriver={findDriver} onAlternatives={alternatives} />)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="ai-msg flex gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#1b6dff] to-[#3f86ff] text-white"><AiGlyph size={14} /></div>
              <div className="rounded-[14px] rounded-tl-[4px] border border-[#e8ecf3] bg-white px-2 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"><TypingDots /></div>
            </div>
          )}
        </div>

        {/* Quick replies */}
        {!sending && lastAssistantHasProducts && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-1.5">
            {QUICK_REPLIES.map((q) => (
              <button key={q} type="button" onClick={() => send(q)} className="rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#475569] transition hover:border-[#1b6dff] hover:text-[#1b6dff]">{q}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-[#e8ecf3] bg-white px-3 py-3">
          <div className="flex items-end gap-2 rounded-[14px] border border-[#e2e8f0] bg-[#f8fafc] p-1.5 transition-colors focus-within:border-[#1b6dff] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(27,109,255,0.1)]">
            <button type="button" onClick={toggleVoice} title="Voice input" className={`flex h-9 w-9 flex-none items-center justify-center rounded-[10px] transition ${listening ? "bg-[#fee2e2] text-[#dc2626]" : "text-[#94a3b8] hover:bg-[#eef2f7] hover:text-[#475569]"}`} style={listening ? { animation: "micPulse 1s infinite" } : {}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 17v4" /></svg>
            </button>
            <textarea ref={taRef} rows={1} value={input} onChange={(e) => { setInput(e.target.value); autoGrow(e.target); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={listening ? "Listening…" : "Ask, or paste a customer enquiry…"}
              className="max-h-[120px] flex-1 resize-none bg-transparent px-1.5 py-1.5 text-[13px] text-[#0f172a] outline-none placeholder:text-[#94a3b8]" />
            <button type="button" onClick={() => send()} disabled={sending || !input.trim()} className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-gradient-to-br from-[#1b6dff] to-[#3f86ff] text-white shadow-[0_4px_12px_rgba(27,109,255,0.3)] transition disabled:opacity-35 disabled:shadow-none" title="Send">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-[#94a3b8]">AI can make mistakes — verify specs before quoting.</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
