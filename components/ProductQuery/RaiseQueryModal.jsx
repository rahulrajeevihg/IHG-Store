import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { createProductQuery, extractFrappeErrorMessage, uploadFileToErp } from "@/libs/api";
import {
  PRODUCT_QUERY_SEVERITIES,
  PRODUCT_QUERY_TYPES,
  buildProductQueryContext,
} from "./shared";

const INITIAL_FORM = {
  query_type: "general_query",
  severity: "medium",
  message: "",
  suggested_value: "",
};

export default function RaiseQueryModal({ open, onClose, product, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const productContext = useMemo(() => buildProductQueryContext(product), [product]);

  useEffect(() => {
    if (!open) return undefined;
    setForm(INITIAL_FORM);
    setAttachment(null);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, submitting]);

  if (!open) return null;

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!productContext.item_code) {
      toast.error("Product context is missing. Reopen this from a product.");
      return;
    }
    if (!form.message.trim()) {
      toast.error("Please write your question for the product team.");
      return;
    }

    setSubmitting(true);
    try {
      let attachmentUrl = "";
      if (attachment) {
        const uploaded = await uploadFileToErp(attachment, { folder: "Home/Attachments" });
        attachmentUrl = uploaded?.file_url || uploaded?.message?.file_url || "";
      }

      const payload = {
        item_code: productContext.item_code,
        item_name_snapshot: productContext.item_name_snapshot,
        brand: productContext.brand,
        category_list: productContext.category_list,
        website_image_url: productContext.website_image_url,
        query_type: form.query_type,
        severity: form.severity,
        suggested_value: form.suggested_value,
        message: form.message.trim(),
        attachment: attachmentUrl,
      };

      const detail = await createProductQuery(payload);
      const query = detail?.query;
      if (!query?.id) {
        throw new Error("Query was created but no reference was returned.");
      }
      toast.success(`Query ${query.id} started — chatting with the product team.`);
      onCreated?.(detail);
    } catch (error) {
      toast.error(extractFrappeErrorMessage(error, error?.message || "Could not start the query."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000]">
      <div className="absolute inset-0 bg-black/45" onClick={() => !submitting && onClose?.()} />

      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <section
          role="dialog"
          aria-modal="true"
          className="flex max-h-[88vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[24px] border border-[#e5e7eb] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
        >
          <header className="border-b border-[#edf0f3] px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9aa4b2]">
                  Product Query Desk
                </p>
                <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-[#111827]">
                  Ask the product team
                </h2>
                <p className="mt-2 text-[13px] text-[#6b7280]">
                  Start a live chat about this product. An item manager will reply and, if needed,
                  open a tracked ticket.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !submitting && onClose?.()}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#e5e7eb] text-[#6b7280] transition hover:border-[#111827] hover:text-[#111827]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#edf0f3] bg-[#f8fafc] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Product</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  {productContext.item_code || "Unknown SKU"}
                </span>
                {productContext.item_name_snapshot && (
                  <span className="text-[13px] font-medium text-[#475467]">
                    {productContext.item_name_snapshot}
                  </span>
                )}
              </div>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfcfe] px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Query type">
                  <select
                    value={form.query_type}
                    onChange={(event) => updateField("query_type", event.target.value)}
                    className={inputClassName}
                  >
                    {PRODUCT_QUERY_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Severity">
                  <select
                    value={form.severity}
                    onChange={(event) => updateField("severity", event.target.value)}
                    className={inputClassName}
                  >
                    {PRODUCT_QUERY_SEVERITIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Your message" required>
                  <textarea
                    value={form.message}
                    onChange={(event) => updateField("message", event.target.value)}
                    rows={5}
                    placeholder="Ask your question or describe what looks wrong with this product."
                    className={`${inputClassName} min-h-[140px] resize-y py-3`}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Suggested correction (optional)">
                  <textarea
                    value={form.suggested_value}
                    onChange={(event) => updateField("suggested_value", event.target.value)}
                    rows={2}
                    placeholder="If you know the correct value, share it here."
                    className={`${inputClassName} min-h-[72px] resize-y py-3`}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Attachment (optional)">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xlsx,.csv,.txt"
                    onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                    className="block w-full rounded-xl border border-dashed border-[#d8e0ea] bg-white px-4 py-3 text-[13px] text-[#475467]"
                  />
                </Field>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-3 border-t border-[#edf0f3] bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => onClose?.()}
                className="h-11 rounded-xl border border-[#dbe5ef] px-5 text-[13px] font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center rounded-xl bg-[#111827] px-5 text-[13px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Starting..." : "Start chat"}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-1 text-[12px] font-semibold text-[#344054]">
        <span>{label}</span>
        {required && <span className="text-[#dc2626]">*</span>}
      </div>
      {children}
    </label>
  );
}

const inputClassName =
  "h-11 w-full rounded-xl border border-[#d8e0ea] bg-white px-4 text-[13px] text-[#111827] outline-none transition placeholder:text-[#98a2b3] focus:border-[#111827] focus:ring-4 focus:ring-[#111827]/5";
