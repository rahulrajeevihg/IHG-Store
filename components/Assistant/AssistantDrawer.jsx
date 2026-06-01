import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import Image from "next/image";
import { toast } from "react-toastify";
import {
  check_Image, product_assistant_chat, insert_cart_items,
  save_assistant_conversation, list_assistant_conversations,
  get_assistant_conversation, delete_assistant_conversation, submit_assistant_feedback,
} from "@/libs/api";
import AssistantProductModal from "./AssistantProductModal";

// Polished slide-over chat for the grounded Product Assistant. Brand AI accent is
// the app's blue gradient (#1b6dff -> #3f86ff). Sends running history to
// product_assistant_chat; renders reply (markdown) + grounded product cards with
// inline actions. Features: typewriter reveal, voice input, copy, quick replies,
// multi-conversation history, in-place product modal, citations, action buttons.

const CONV_KEY = "ihg_assistant_conversations_v1"; // [{id,title,messages,updatedAt}]
const LEGACY_KEY = "ihg_assistant_history_v1"; // pre-multi-conversation single session
const newId = () => `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
const titleFrom = (msgs) => {
  const u = (msgs || []).find((m) => m.role === "user");
  const t = (u?.content || "New chat").trim();
  return t.length > 42 ? `${t.slice(0, 42)}…` : t;
};
const relTime = (ts) => {
  const s = Math.max(0, Math.round((Date.now() - (ts || 0)) / 1000));
  if (s < 60) return "just now";
  const mn = Math.round(s / 60); if (mn < 60) return `${mn}m ago`;
  const h = Math.round(mn / 60); if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24); return d < 7 ? `${d}d ago` : new Date(ts).toLocaleDateString();
};
const SUGGESTIONS = [
  { icon: "🔌", text: "Is a driver required for LB2111.W.830.WWH.36?" },
  { icon: "⚡", text: "Find a suitable driver for LB2100.W.830.WBK.36" },
  { icon: "🔁", text: "Alternative of LB2100.W.830.WBK.36" },
  { icon: "💡", text: "Cheapest 3000K IP65 spotlight in stock" },
];
const DRIVER_RE = /driver|\bdim\b|constant current|constant voltage|\bcc\b|\bcv\b/i;
const ALT_RE = /alternative|\balt\b|similar|equivalent|replace|cross[- ]?sell/i;
const SPEC_RE = /\d|watt|\bw\b|kelvin|\bk\b|ip\d|lumen|beam|°|volt|\bvdc\b|\bma\b/i;

// Context-aware "reasoning" steps shown while the assistant works — narrates what
// it's doing based on the pending question (it reads as thinking, not just waiting).
function thinkingSteps(q) {
  const t = (q || "").toLowerCase();
  const steps = ["Understanding your request"];
  if (DRIVER_RE.test(t)) steps.push("Checking driver compatibility");
  if (ALT_RE.test(t)) steps.push("Finding alternatives");
  steps.push("Searching the live catalog");
  if (SPEC_RE.test(t)) steps.push("Matching your specs");
  steps.push("Ranking the best options");
  return steps;
}

// Friendly labels for the "what I did" trace, derived from the returned tool_trace.
const TOOL_LABELS = {
  search_products: { icon: "🔍", label: "searched catalog" },
  get_product: { icon: "📦", label: "looked up product" },
  find_alternatives: { icon: "🔁", label: "found alternatives" },
  check_driver_requirement: { icon: "🔌", label: "checked driver need" },
  find_driver: { icon: "⚡", label: "matched a driver" },
  add_to_cart: { icon: "🛒", label: "added to quote" },
};
function traceSteps(trace) {
  if (!Array.isArray(trace) || !trace.length) return [];
  const out = [];
  trace.forEach((t) => {
    const key = t?.tool;
    if (TOOL_LABELS[key] && !out.find((s) => s.key === key)) out.push({ key, ...TOOL_LABELS[key] });
  });
  return out;
}

// Context-aware follow-up chips generated from the last results + question.
function dynamicQuickReplies(messages) {
  const rev = [...messages].reverse();
  const lastA = rev.find((m) => m.role === "assistant");
  const lastU = rev.find((m) => m.role === "user");
  const products = (lastA && lastA.products) || [];
  if (!products.length) return [];
  const ut = (lastU?.content || "").toLowerCase();
  const prices = products.map((p) => Number(p.rate || 0)).filter((n) => n > 0);
  const varied = prices.length > 1 && Math.max(...prices) > Math.min(...prices) * 1.15;
  const chips = [];
  if (!/in stock/.test(ut)) chips.push("In stock only");
  if (varied) chips.push("Show the cheapest");
  if (products.length >= 3) chips.push("Compare the top 3");
  if (DRIVER_RE.test(ut)) chips.push("Constant-current only");
  else chips.push("Find a driver for the first one");
  chips.push("Add the first to my quote");
  return chips.slice(0, 5);
}

// Spec pills extracted from a product doc; a pill glows green when its value also
// appears in the user's query (i.e. that spec was an explicit match).
function specPills(item, query) {
  const q = (query || "").toLowerCase();
  const pills = [];
  const push = (raw, normalized) => {
    if (!raw) return;
    const matched = normalized.some((n) => n && q.includes(String(n).toLowerCase()));
    pills.push({ text: raw, matched });
  };
  if (item?.power) push(String(item.power).replace(/\s+/g, ""), [String(item.power).replace(/[^\d.]/g, "")]);
  if (item?.color_temp) push(String(item.color_temp).replace(/\s+/g, ""), [String(item.color_temp).replace(/[^\d]/g, "")]);
  if (item?.ip_rate) push(String(item.ip_rate).toUpperCase().replace(/\s+/g, ""), [String(item.ip_rate).replace(/[^\d]/g, "")]);
  if (item?.beam_angle) push(`${item.beam_angle}°`, [String(item.beam_angle).replace(/[^\d]/g, "")]);
  return pills.slice(0, 4);
}

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

function ProductChip({ item, query, onOpen, onAddToCart, onFindDriver, onAlternatives }) {
  const image = check_Image(item?.website_image_url || item?.image || "");
  const inStock = Number(item?.stock || 0) > 0;
  const pills = specPills(item, query);
  return (
    <div className="group flex w-[186px] min-w-[186px] flex-none snap-start flex-col rounded-[14px] border border-[#e8ecf3] bg-white p-2 transition-all duration-200 hover:border-[#1b6dff] hover:shadow-[0_10px_28px_rgba(27,109,255,0.16)]">
      <button type="button" onClick={() => onOpen(item)} className="text-left">
        <div className="relative mb-1.5 h-[78px] w-full overflow-hidden rounded-[10px] bg-gradient-to-br from-[#f7f9fc] to-[#eef3fb]">
          {!!image && <Image src={image} alt={item?.item_code || "item"} fill className="object-contain p-2 transition-transform duration-300 group-hover:scale-105" />}
        </div>
        <p className="line-clamp-1 font-mono text-[10px] font-semibold text-[#0f172a]">{item?.item_code || "-"}</p>
        <p className="line-clamp-2 min-h-[28px] text-[10px] leading-[1.3] text-[#64748b]">{item?.item_name || "-"}</p>
        {pills.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {pills.map((p, idx) => (
              <span key={idx} className={`rounded-[5px] px-1.5 py-0.5 text-[8.5px] font-bold ${p.matched ? "bg-[#dcfce7] text-[#15803d] ring-1 ring-[#86efac]" : "bg-[#f1f5f9] text-[#64748b]"}`}>{p.text}</span>
            ))}
          </div>
        )}
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

// Live "reasoning" indicator — advances through context-aware steps while the
// backend works, then holds on the last step (no fake completion claims).
function ThinkingStatus({ query }) {
  const steps = useMemo(() => thinkingSteps(query), [query]);
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    const id = setInterval(() => setI((p) => Math.min(p + 1, steps.length - 1)), 850);
    return () => clearInterval(id);
  }, [steps]);
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <TypingDots />
      <span key={i} className="text-[11.5px] font-medium text-[#475569]" style={{ animation: "aiFade .45s ease-out both" }}>{steps[i]}…</span>
    </div>
  );
}

export default function AssistantDrawer({ open, onClose, seedMessage = "" }) {
  const router = useRouter();
  const [messages, setMessages] = useState([]); // {role, content, products?, displayed?, cited?}
  const [conversations, setConversations] = useState([]); // saved sessions (ERP-backed, localStorage cached)
  const [activeId, setActiveId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [convFeedback, setConvFeedback] = useState({ satisfaction: "", found_required_data: "" });
  const [modalProduct, setModalProduct] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingQuery, setPendingQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const seededRef = useRef(false);
  const recognitionRef = useRef(null);
  const activeIdRef = useRef(null);
  const erpSaveTimer = useRef(null);

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  /* Debounced write-through to ERPNext (server is source of truth; localStorage is cache) */
  const queueErpSave = (id, msgs) => {
    if (typeof window === "undefined" || !id || !msgs || !msgs.length) return;
    const slim = msgs.map(({ role, content, products, rating }) => ({ role, content, products: products || [], ...(rating ? { rating } : {}) }));
    const title = titleFrom(slim);
    if (erpSaveTimer.current) clearTimeout(erpSaveTimer.current);
    erpSaveTimer.current = setTimeout(() => {
      save_assistant_conversation({ conversation_id: id, title, messages: slim, route: typeof window !== "undefined" ? window.location.pathname : "" }).catch(() => {});
    }, 600);
  };

  /* Scroll-lock while open */
  useEffect(() => {
    if (typeof document === "undefined" || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => setMounted(true));
    return () => { document.body.style.overflow = prev; setMounted(false); cancelAnimationFrame(id); };
  }, [open]);

  /* Load saved conversations + most-recent session on open */
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    let convs = [];
    try { convs = JSON.parse(localStorage.getItem(CONV_KEY) || "[]"); } catch (_) {}
    if (!Array.isArray(convs)) convs = [];
    if (!convs.length) {
      // one-time migration of the old single-session history
      try {
        const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]");
        if (Array.isArray(legacy) && legacy.length) convs = [{ id: newId(), title: titleFrom(legacy), messages: legacy, updatedAt: Date.now() }];
      } catch (_) {}
    }
    setConversations(convs);
    if (convs.length) {
      const top = convs[0];
      setActiveId(top.id); activeIdRef.current = top.id;
      setMessages((top.messages || []).map((m) => ({ ...m, displayed: m.content })));
      setConvFeedback({ satisfaction: top.satisfaction || "", found_required_data: top.found_required_data || "" });
    } else {
      setActiveId(null); activeIdRef.current = null; setMessages([]);
      setConvFeedback({ satisfaction: "", found_required_data: "" });
    }

    // Pull the authoritative list from ERPNext and merge (keep any locally-cached messages by id).
    list_assistant_conversations(30, 0).then((rows) => {
      if (!Array.isArray(rows) || !rows.length) return;
      setConversations((prev) => {
        const cachedById = Object.fromEntries(prev.map((c) => [c.id, c]));
        return rows.map((r) => ({
          id: r.conversation_id,
          title: r.title || "New chat",
          message_count: Number(r.message_count || 0),
          satisfaction: r.satisfaction || "",
          found_required_data: r.found_required_data || "",
          updatedAt: r.last_activity ? new Date(r.last_activity).getTime() : Date.now(),
          messages: cachedById[r.conversation_id]?.messages, // lazy-loaded on open if absent
        }));
      });
    }).catch(() => {});
  }, [open]);

  /* Persist the active conversation when messages settle (skip mid-typewriter) */
  useEffect(() => {
    if (typeof window === "undefined" || !open || !messages.length) return;
    const last = messages[messages.length - 1];
    if (last && last.role === "assistant" && last.displayed !== undefined && last.displayed !== last.content) return;
    let id = activeIdRef.current;
    if (!id) { id = newId(); activeIdRef.current = id; setActiveId(id); }
    const slim = messages.map(({ role, content, products }) => ({ role, content, products: products || [] }));
    const entry = { id, title: titleFrom(slim), messages: slim, updatedAt: Date.now() };
    setConversations((prev) => {
      const next = [entry, ...prev.filter((c) => c.id !== id)].slice(0, 30);
      try { localStorage.setItem(CONV_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
    queueErpSave(id, messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, open]);

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
    setPendingQuery(msg);
    try {
      const res = await product_assistant_chat(msg, history);
      const trace = Array.isArray(res.tool_trace) ? res.tool_trace : [];
      const cited = trace.some((t) => ["search_products", "get_product", "find_alternatives", "find_driver", "check_driver_requirement"].includes(t.tool));
      setMessages([...next, { role: "assistant", content: res.reply || "(no response)", displayed: "", products: res.products || [], cited, trace, query: msg }]);
      if (Array.isArray(res.cart_added) && res.cart_added.length) {
        toast.success(`Added ${res.cart_added.length} item(s) to your quote`);
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (e) {
      setMessages([...next, { role: "assistant", content: "Sorry — I couldn't reach the assistant. Please try again.", displayed: "", products: [], error: true }]);
    } finally {
      setSending(false);
      setPendingQuery("");
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

  const openProduct = (item) => { if (item?.item_code) setModalProduct(item); };
  const openProductPage = (item) => { if (item?.item_code) { router.push(`/pr/${encodeURIComponent(item.item_code)}`); onClose?.(); } };
  const addToCart = async (item, qty = 1) => {
    try {
      const r = await insert_cart_items({ item_code: item.item_code, qty });
      if ((r || {}).status === "success") { toast.success(`Added ${qty} × ${item.item_code} to quote`); window.dispatchEvent(new Event("cart-updated")); }
      else toast.error((r || {}).message || "Could not add to cart");
    } catch (_) { toast.error("Could not add to cart"); }
  };
  const findDriver = (item) => send(`Find a suitable driver for ${item.item_code}`);
  const alternatives = (item) => send(`Show alternatives for ${item.item_code}`);

  const copyMessage = (text) => { try { navigator.clipboard.writeText(text); toast.success("Copied"); } catch (_) {} };

  /* ── Conversation management ── */
  const newChat = () => {
    setActiveId(null); activeIdRef.current = null; setMessages([]); setInput("");
    setConvFeedback({ satisfaction: "", found_required_data: "" }); setShowHistory(false);
  };
  const loadConversation = async (c) => {
    setActiveId(c.id); activeIdRef.current = c.id; setShowHistory(false);
    setConvFeedback({ satisfaction: c.satisfaction || "", found_required_data: c.found_required_data || "" });
    if (Array.isArray(c.messages) && c.messages.length) {
      setMessages(c.messages.map((m) => ({ ...m, displayed: m.content })));
      return;
    }
    // Came from the ERP list without a cached body — fetch the full conversation.
    setMessages([]);
    try {
      const full = await get_assistant_conversation(c.id);
      if (activeIdRef.current !== c.id) return;
      setMessages((full.messages || []).map((m) => ({ ...m, displayed: m.content })));
      setConvFeedback({ satisfaction: full.satisfaction || "", found_required_data: full.found_required_data || "" });
    } catch (_) {}
  };
  const deleteConversation = (id, e) => {
    e?.stopPropagation();
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try { localStorage.setItem(CONV_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
    delete_assistant_conversation(id).catch(() => {});
    if (activeIdRef.current === id) { setActiveId(null); activeIdRef.current = null; setMessages([]); setConvFeedback({ satisfaction: "", found_required_data: "" }); }
  };

  /* ── Feedback (satisfaction + per-reply thumbs) — server-side for retraining ── */
  const rateMessage = (index, rating) => {
    setMessages((prev) => {
      const copy = [...prev];
      if (copy[index]) copy[index] = { ...copy[index], rating: copy[index].rating === rating ? "" : rating };
      return copy;
    });
    const id = activeIdRef.current;
    if (id) {
      const applied = (messages[index] && messages[index].rating === rating) ? "" : rating;
      submit_assistant_feedback({ conversation_id: id, message_ratings: { [index]: applied } }).catch(() => {});
    }
  };
  const setConversationFeedback = (satisfaction, found_required_data) => {
    setConvFeedback({ satisfaction, found_required_data });
    const id = activeIdRef.current;
    if (id) submit_assistant_feedback({ conversation_id: id, satisfaction, found_required_data }).catch(() => {});
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, satisfaction, found_required_data } : c)));
  };

  if (!open || typeof document === "undefined") return null;
  const quickReplies = dynamicQuickReplies(messages);

  return createPortal(
    <div className="fixed inset-0 z-[10001]">
      <style>{`
        @keyframes aiBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}
        @keyframes aiPulse{0%,100%{box-shadow:0 0 0 0 rgba(27,109,255,.35)}50%{box-shadow:0 0 0 6px rgba(27,109,255,0)}}
        @keyframes aiMsgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .ai-msg{animation:aiMsgIn .22s ease-out both}
        .ai-panel{transition:transform .28s cubic-bezier(.22,1,.36,1)}
        @keyframes micPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
        @keyframes aiFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
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
              <button type="button" onClick={() => setShowHistory((s) => !s)} title="Chat history" className={`relative rounded-lg p-2 transition hover:bg-white/15 hover:text-white ${showHistory ? "bg-white/15 text-white" : "text-white/80"}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 106 5.3L3 8" /><path d="M12 7v5l3 2" /></svg>
                {conversations.length > 0 && <span className="absolute right-1 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-white px-1 text-[8px] font-bold text-[#1b6dff]">{conversations.length}</span>}
              </button>
              {messages.length > 0 && (
                <button type="button" onClick={newChat} title="New chat" className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              )}
              <button type="button" onClick={() => onClose?.()} title="Close" className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="absolute inset-x-0 top-[64px] bottom-0 z-20 flex flex-col bg-[#f7f9fc]" style={{ animation: "aiMsgIn .2s ease-out both" }}>
            <div className="flex items-center justify-between border-b border-[#e8ecf3] bg-white px-4 py-2.5">
              <p className="text-[12.5px] font-semibold text-[#0f172a]">Chat history</p>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={newChat} className="rounded-[8px] bg-[#0f172a] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#1e293b]">+ New chat</button>
                <button type="button" onClick={() => setShowHistory(false)} title="Back" className="rounded-lg p-1.5 text-[#94a3b8] transition hover:bg-[#eef2f7] hover:text-[#475569]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
              {conversations.length === 0 ? (
                <div className="mt-10 text-center text-[12px] text-[#94a3b8]">No saved chats yet.</div>
              ) : (
                conversations.map((c) => {
                  const isActive = c.id === activeId;
                  const preview = (c.messages || []).filter((m) => m.role === "assistant").slice(-1)[0]?.content || "";
                  const count = (c.messages || []).length || Number(c.message_count || 0);
                  const sat = c.satisfaction || "";
                  const satTone = sat === "Satisfied" ? "bg-[#22c55e]" : sat === "Partially" ? "bg-[#f59e0b]" : sat === "Not Satisfied" ? "bg-[#ef4444]" : "";
                  return (
                    <div key={c.id} onClick={() => loadConversation(c)} className={`group/conv cursor-pointer rounded-[12px] border px-3 py-2.5 transition ${isActive ? "border-[#1b6dff] bg-[#eef5ff]" : "border-[#e8ecf3] bg-white hover:border-[#1b6dff]"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-1 flex-1 text-[12.5px] font-semibold text-[#0f172a]">{c.title}</p>
                        <button type="button" onClick={(e) => deleteConversation(c.id, e)} title="Delete" className="rounded-md p-1 text-[#cbd5e1] opacity-0 transition group-hover/conv:opacity-100 hover:bg-[#fee2e2] hover:text-[#dc2626]">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /></svg>
                        </button>
                      </div>
                      {preview && <p className="mt-0.5 line-clamp-1 text-[11px] text-[#94a3b8]">{preview.replace(/[*`#]/g, "")}</p>}
                      <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#cbd5e1]">
                        {satTone && <span className={`h-1.5 w-1.5 rounded-full ${satTone}`} title={sat} />}
                        {relTime(c.updatedAt)}{count ? ` · ${count} messages` : ""}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

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
                  {!isUser && body === m.content && Array.isArray(m.trace) && traceSteps(m.trace).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1 pl-1">
                      {traceSteps(m.trace).map((s, si) => (
                        <span key={s.key} className="inline-flex items-center gap-0.5 text-[9.5px] text-[#94a3b8]">
                          {si > 0 && <span className="mr-0.5 text-[#cbd5e1]">·</span>}<span>{s.icon}</span> {s.label}
                        </span>
                      ))}
                      {Array.isArray(m.products) && m.products.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[9.5px] font-semibold text-[#1b6dff]"><span className="mr-0.5 text-[#cbd5e1]">·</span>{m.products.length} match{m.products.length === 1 ? "" : "es"}</span>
                      )}
                    </div>
                  )}
                  {!isUser && body === m.content && (
                    <div className="mt-1 flex items-center gap-2 pl-1">
                      {m.cited && <p className="flex items-center gap-1 text-[9.5px] text-[#94a3b8]"><span className="h-1 w-1 rounded-full bg-[#22c55e]" /> from live catalog · stock &amp; price at query time</p>}
                      <div className="ml-auto flex items-center gap-0.5">
                        <button type="button" onClick={() => rateMessage(i, "up")} title="Helpful" className={`rounded-md p-1 transition ${m.rating === "up" ? "bg-[#dcfce7] text-[#15803d]" : "text-[#cbd5e1] hover:bg-[#f1f5f9] hover:text-[#475569]"}`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2a3.13 3.13 0 013 3.88z" /></svg>
                        </button>
                        <button type="button" onClick={() => rateMessage(i, "down")} title="Not helpful" className={`rounded-md p-1 transition ${m.rating === "down" ? "bg-[#fee2e2] text-[#b91c1c]" : "text-[#cbd5e1] hover:bg-[#f1f5f9] hover:text-[#475569]"}`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2" /><path d="M9 18.12L10 14H4.17a2 2 0 01-1.92-2.56l2.33-8A2 2 0 016.5 2H20a2 2 0 012 2v8a2 2 0 01-2 2h-2.76a2 2 0 00-1.79 1.11L12 22a3.13 3.13 0 01-3-3.88z" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                  {!isUser && Array.isArray(m.products) && m.products.length > 0 && (
                    <div className="mt-2.5 flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {m.products.map((p, j) => <ProductChip key={`${p.item_code}-${j}`} item={p} query={m.query} onOpen={openProduct} onAddToCart={addToCart} onFindDriver={findDriver} onAlternatives={alternatives} />)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="ai-msg flex gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#1b6dff] to-[#3f86ff] text-white"><AiGlyph size={14} /></div>
              <div className="rounded-[14px] rounded-tl-[4px] border border-[#e8ecf3] bg-white px-2.5 py-1 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"><ThinkingStatus query={pendingQuery} /></div>
            </div>
          )}
        </div>

        {/* Conversation satisfaction — captured server-side for retraining/gap analysis */}
        {!sending && messages.filter((m) => m.role === "assistant" && !m.error).length >= 2 && (
          convFeedback.satisfaction ? (
            <div className="mx-4 mb-1.5 flex items-center gap-1.5 rounded-[12px] border border-[#dcfce7] bg-[#f0fdf4] px-3 py-1.5 text-[11px] font-medium text-[#15803d]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              Thanks — feedback saved ({convFeedback.satisfaction})
              <button type="button" onClick={() => setConvFeedback({ satisfaction: "", found_required_data: "" })} className="ml-auto text-[10px] font-semibold text-[#15803d]/70 underline hover:text-[#15803d]">change</button>
            </div>
          ) : (
            <div className="mx-4 mb-1.5 flex items-center gap-2 rounded-[12px] border border-[#e8ecf3] bg-white px-3 py-2">
              <span className="text-[11.5px] font-medium text-[#475569]">Did you find what you needed?</span>
              <div className="ml-auto flex items-center gap-1">
                <button type="button" onClick={() => setConversationFeedback("Satisfied", "Yes")} className="rounded-full bg-[#f0fdf4] px-2.5 py-1 text-[11px] font-semibold text-[#15803d] transition hover:bg-[#dcfce7]">Yes</button>
                <button type="button" onClick={() => setConversationFeedback("Partially", "Partially")} className="rounded-full bg-[#fff7ed] px-2.5 py-1 text-[11px] font-semibold text-[#c2410c] transition hover:bg-[#fed7aa]">Partly</button>
                <button type="button" onClick={() => setConversationFeedback("Not Satisfied", "No")} className="rounded-full bg-[#fef2f2] px-2.5 py-1 text-[11px] font-semibold text-[#b91c1c] transition hover:bg-[#fee2e2]">No</button>
              </div>
            </div>
          )
        )}

        {/* Quick replies — context-aware, generated from the last results + question */}
        {!sending && quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-1.5">
            {quickReplies.map((q) => (
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

      {modalProduct && (
        <AssistantProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onAddToCart={addToCart}
          onFindDriver={findDriver}
          onAlternatives={alternatives}
          onOpenFull={openProductPage}
        />
      )}
    </div>,
    document.body
  );
}
