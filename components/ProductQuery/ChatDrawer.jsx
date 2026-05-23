import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import {
  escalateProductQueryToTicket,
  extractFrappeErrorMessage,
  getProductQuery,
  postProductQueryMessage,
  rateProductQuerySolution,
  reopenProductQuery,
  resolveProductQuery,
  updateProductQuery,
  uploadFileToErp,
} from "@/libs/api";
import { bumpQueryRefresh } from "@/redux/slice/productQuerySlice";
import {
  PRODUCT_QUERY_STATUSES,
  formatQueryLabel,
  formatRelativeTime,
  getQueryStatusMeta,
} from "./shared";

const POLL_INTERVAL_MS = 4000;

export default function ChatDrawer({ open, queryId, onClose }) {
  const dispatch = useDispatch();
  const [detail, setDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [solutionNotes, setSolutionNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const messagesRef = useRef([]);
  const scrollRef = useRef(null);
  messagesRef.current = messages;

  const lastTs = useCallback(() => {
    const rows = messagesRef.current;
    return rows.length ? rows[rows.length - 1].created_at : "";
  }, []);

  const mergeMessages = useCallback((incoming) => {
    if (!Array.isArray(incoming) || !incoming.length) return;
    setMessages((current) => {
      const seen = new Set(current.map((m) => m.id));
      const fresh = incoming.filter((m) => m && !seen.has(m.id));
      return fresh.length ? [...current, ...fresh] : current;
    });
  }, []);

  // Initial load when a thread opens.
  useEffect(() => {
    if (!open || !queryId) return undefined;
    let active = true;
    setLoading(true);
    setMessages([]);
    setDetail(null);
    setResolveOpen(false);
    setSolutionNotes("");
    setRating(0);
    setRatingComment("");

    (async () => {
      try {
        const data = await getProductQuery(queryId);
        if (!active || !data) return;
        setDetail(data);
        setMessages(data.messages || []);
      } catch (error) {
        if (active) toast.error(extractFrappeErrorMessage(error, "Could not open this query."));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, queryId]);

  // Polling for new messages while open + tab visible.
  useEffect(() => {
    if (!open || !queryId) return undefined;
    const tick = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const data = await getProductQuery(queryId, lastTs());
        if (!data) return;
        setDetail((prev) => ({ ...(prev || {}), ...data, messages: undefined }));
        mergeMessages(data.messages);
      } catch (_) {
        /* transient poll failure — keep last good state */
      }
    };
    const id = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [open, queryId, lastTs, mergeMessages]);

  // Auto-scroll to newest.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Body scroll lock.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const query = detail?.query;
  const canManage = Boolean(detail?.can_manage);
  const canRate = Boolean(detail?.can_rate);
  const canReopen = Boolean(detail?.can_reopen);
  const viewerSide = detail?.viewer_side || "reporter";
  const statusMeta = getQueryStatusMeta(query?.status);

  const refresh = async () => {
    try {
      const data = await getProductQuery(queryId);
      if (data) {
        setDetail(data);
        setMessages(data.messages || []);
      }
      dispatch(bumpQueryRefresh());
    } catch (_) {
      /* ignore */
    }
  };

  const handleSend = async (event) => {
    event?.preventDefault?.();
    if (!input.trim() && !attachment) return;
    setSending(true);
    try {
      let attachmentUrl = "";
      if (attachment) {
        const uploaded = await uploadFileToErp(attachment, { folder: "Home/Attachments" });
        attachmentUrl = uploaded?.file_url || uploaded?.message?.file_url || "";
      }
      const data = await postProductQueryMessage({
        query_id: queryId,
        message: input.trim(),
        attachment: attachmentUrl,
      });
      setInput("");
      setAttachment(null);
      if (data) {
        setDetail((prev) => ({ ...(prev || {}), ...data, messages: undefined }));
        mergeMessages(data.messages);
      }
      dispatch(bumpQueryRefresh());
    } catch (error) {
      toast.error(extractFrappeErrorMessage(error, "Message failed to send."));
    } finally {
      setSending(false);
    }
  };

  const runAction = async (fn, successMsg) => {
    setBusy(true);
    try {
      await fn();
      if (successMsg) toast.success(successMsg);
      await refresh();
    } catch (error) {
      toast.error(extractFrappeErrorMessage(error, "Action failed."));
    } finally {
      setBusy(false);
    }
  };

  const handleEscalate = () =>
    runAction(() => escalateProductQueryToTicket(queryId, { severity: query?.severity }), "Escalated to a ticket.");

  const handleStatusChange = (status) =>
    runAction(() => updateProductQuery(queryId, { status }), "Status updated.");

  const handleResolve = async () => {
    if (!solutionNotes.trim()) {
      toast.error("Add a short solution note before resolving.");
      return;
    }
    await runAction(() => resolveProductQuery(queryId, solutionNotes.trim()), "Marked resolved.");
    setResolveOpen(false);
    setSolutionNotes("");
  };

  const handleReopen = () => runAction(() => reopenProductQuery(queryId, ""), "Reopened.");

  const handleRate = async () => {
    if (!rating) {
      toast.error("Pick a rating from 1 to 5.");
      return;
    }
    await runAction(() => rateProductQuerySolution(queryId, rating, ratingComment.trim()), "Thanks for rating!");
  };

  return (
    <div className="fixed inset-0 z-[10001]">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose?.()} />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col bg-white shadow-[0_0_60px_rgba(15,23,42,0.28)]">
        {/* Header */}
        <header className="border-b border-[#edf0f3] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa4b2]">
                  {query?.stage === "ticket" ? "Ticket" : "Chat"} · {query?.id || ""}
                </span>
                {query?.status && (
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusMeta.className}`}>
                    {statusMeta.label}
                  </span>
                )}
              </div>
              <h3 className="mt-1 truncate text-[16px] font-semibold text-[#111827]">
                {query?.item_name_snapshot || query?.item_code || "Product query"}
              </h3>
              <p className="truncate text-[12px] text-[#667085]">{query?.item_code}</p>
            </div>
            <button
              type="button"
              onClick={() => onClose?.()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e5e7eb] text-[#6b7280] transition hover:border-[#111827] hover:text-[#111827]"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Admin controls */}
          {canManage && query && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {query.stage === "chat" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleEscalate}
                  className="h-8 rounded-lg border border-[#dbe5ef] px-3 text-[12px] font-semibold text-[#344054] transition hover:bg-[#f8fafc] disabled:opacity-50"
                >
                  Escalate to ticket
                </button>
              )}
              {!["resolved", "closed"].includes(query.status) && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setResolveOpen((v) => !v)}
                  className="h-8 rounded-lg bg-[#047857] px-3 text-[12px] font-semibold text-white transition hover:bg-[#036b4d] disabled:opacity-50"
                >
                  Resolve
                </button>
              )}
              <select
                value=""
                disabled={busy}
                onChange={(event) => event.target.value && handleStatusChange(event.target.value)}
                className="h-8 rounded-lg border border-[#dbe5ef] bg-white px-2 text-[12px] font-semibold text-[#344054]"
              >
                <option value="">Set status…</option>
                {PRODUCT_QUERY_STATUSES.filter((s) => s.value !== query.status).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {canManage && resolveOpen && (
            <div className="mt-3 rounded-xl border border-[#d1fae5] bg-[#f0fdf9] p-3">
              <textarea
                value={solutionNotes}
                onChange={(event) => setSolutionNotes(event.target.value)}
                rows={3}
                placeholder="Describe the solution / what was corrected in the catalog."
                className="w-full resize-y rounded-lg border border-[#a7f3d0] bg-white px-3 py-2 text-[13px] outline-none"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolveOpen(false)}
                  className="h-8 rounded-lg border border-[#dbe5ef] px-3 text-[12px] font-semibold text-[#344054]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleResolve}
                  className="h-8 rounded-lg bg-[#047857] px-3 text-[12px] font-semibold text-white disabled:opacity-50"
                >
                  Confirm resolve
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f8fafc] px-4 py-4">
          {loading ? (
            <p className="py-10 text-center text-[13px] text-[#98a2b3]">Loading conversation…</p>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-[#98a2b3]">No messages yet.</p>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} viewerSide={viewerSide} />)
          )}

          {query?.solution_notes && ["resolved", "closed"].includes(query.status) && (
            <div className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf3] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#047857]">Solution</p>
              <p className="mt-1 whitespace-pre-wrap text-[13px] text-[#065f46]">{query.solution_notes}</p>
            </div>
          )}
        </div>

        {/* Reporter rating */}
        {canRate && !query?.solution_rating && (
          <div className="border-t border-[#edf0f3] bg-white px-4 py-3">
            <p className="text-[12px] font-semibold text-[#344054]">Rate the solution</p>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-[22px] leading-none ${star <= rating ? "text-[#f59e0b]" : "text-[#d1d5db]"}`}
                  aria-label={`${star} star`}
                >
                  ★
                </button>
              ))}
            </div>
            <input
              value={ratingComment}
              onChange={(event) => setRatingComment(event.target.value)}
              placeholder="Optional feedback"
              className="mt-2 h-9 w-full rounded-lg border border-[#d8e0ea] px-3 text-[13px] outline-none"
            />
            <button
              type="button"
              disabled={busy}
              onClick={handleRate}
              className="mt-2 h-9 w-full rounded-lg bg-[#111827] text-[13px] font-semibold text-white disabled:opacity-50"
            >
              Submit rating
            </button>
          </div>
        )}

        {query?.solution_rating > 0 && (
          <div className="border-t border-[#edf0f3] bg-white px-4 py-2 text-[12px] text-[#667085]">
            Rated {query.solution_rating}/5{query.rating_comment ? ` · "${query.rating_comment}"` : ""}
          </div>
        )}

        {/* Composer */}
        {["resolved", "closed"].includes(query?.status) && !canRate ? (
          <div className="border-t border-[#edf0f3] bg-white px-4 py-3 text-center">
            <p className="text-[12px] text-[#98a2b3]">
              This {query?.stage === "ticket" ? "ticket" : "query"} is {formatQueryLabel(PRODUCT_QUERY_STATUSES, query?.status)}.
            </p>
            {canReopen && (
              <button
                type="button"
                disabled={busy}
                onClick={handleReopen}
                className="mt-2 h-9 rounded-lg border border-[#dbe5ef] px-4 text-[12px] font-semibold text-[#344054] hover:bg-[#f8fafc] disabled:opacity-50"
              >
                Reopen
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSend} className="border-t border-[#edf0f3] bg-white px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend(event);
                  }
                }}
                rows={1}
                placeholder="Type a message…"
                className="max-h-[120px] min-h-[44px] flex-1 resize-y rounded-xl border border-[#d8e0ea] px-3 py-2.5 text-[13px] outline-none focus:border-[#111827]"
              />
              <button
                type="submit"
                disabled={sending || (!input.trim() && !attachment)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#111827] text-white transition hover:bg-black disabled:opacity-50"
                aria-label="Send"
              >
                ➤
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <label className="cursor-pointer text-[12px] font-medium text-[#667085] hover:text-[#111827]">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xlsx,.csv,.txt"
                  onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                />
                {attachment ? `📎 ${attachment.name}` : "📎 Attach"}
              </label>
              {attachment && (
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="text-[12px] text-[#dc2626]"
                >
                  Remove
                </button>
              )}
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}

function MessageBubble({ message, viewerSide }) {
  const isSystem = message.message_type === "system" || message.sender_role === "system";
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-[#eef2f7] px-3 py-1 text-[11px] text-[#667085]">{message.message}</span>
      </div>
    );
  }

  const mine = message.sender_role === viewerSide;
  const isSolution = message.message_type === "solution";

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${mine ? "items-end" : "items-start"}`}>
        {!mine && (
          <p className="mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
            {message.sender_name || (message.sender_role === "admin" ? "Product team" : "Sales")}
          </p>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
            isSolution
              ? "border border-[#a7f3d0] bg-[#ecfdf3] text-[#065f46]"
              : mine
              ? "bg-[#111827] text-white"
              : "border border-[#e5e7eb] bg-white text-[#111827]"
          }`}
        >
          {message.message && <p className="whitespace-pre-wrap break-words">{message.message}</p>}
          {message.attachment && (
            <a
              href={message.attachment}
              target="_blank"
              rel="noreferrer"
              className={`mt-1 inline-block text-[12px] underline ${mine ? "text-white/80" : "text-[#2563eb]"}`}
            >
              📎 Attachment
            </a>
          )}
        </div>
        <p className={`mt-0.5 px-1 text-[10px] text-[#98a2b3] ${mine ? "text-right" : "text-left"}`}>
          {formatRelativeTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
