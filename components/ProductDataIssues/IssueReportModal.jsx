import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  createProductDataIssue,
  extractFrappeErrorMessage,
  uploadFileToErp,
} from "@/libs/api";
import {
  PRODUCT_DATA_AFFECTED_FIELDS,
  PRODUCT_DATA_ISSUE_SEVERITIES,
  PRODUCT_DATA_ISSUE_TYPES,
  buildProductIssueContext,
  formatIssueLabel,
  getCurrentFieldValue,
} from "./shared";

const INITIAL_FORM = {
  issue_type: "wrong_spec",
  severity: "medium",
  affected_field: "",
  description: "",
  suggested_value: "",
};

export default function IssueReportModal({
  open,
  onClose,
  product,
  title = "Report Product Data Issue",
  onCreated,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdIssue, setCreatedIssue] = useState(null);

  const productContext = useMemo(() => buildProductIssueContext(product), [product]);
  const currentValue = useMemo(
    () => getCurrentFieldValue(productContext.product_reference, form.affected_field),
    [productContext.product_reference, form.affected_field]
  );

  useEffect(() => {
    if (!open) return;
    setForm(INITIAL_FORM);
    setAttachment(null);
    setCreatedIssue(null);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, submitting]);

  if (!open) return null;

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    if (!productContext.item_code) {
      return "Product context is missing. Please reopen the dialog from a product.";
    }
    if (!form.issue_type || !form.severity || !form.description.trim()) {
      return "Please complete issue type, severity, and description.";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
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
        issue_type: form.issue_type,
        severity: form.severity,
        affected_field: form.affected_field || "other",
        current_value_snapshot: form.affected_field ? currentValue : "",
        suggested_value: form.suggested_value,
        description: form.description.trim(),
        attachment: attachmentUrl,
      };

      const response = await createProductDataIssue(payload);
      const issue = response?.issue;

      if (!issue?.id) {
        throw new Error("Issue was created, but the response did not include an issue number.");
      }

      setCreatedIssue(issue);
      onCreated?.(issue);
      toast.success(`Issue ${issue.id} created successfully.`);
    } catch (error) {
      toast.error(extractFrappeErrorMessage(error, error?.message || "Could not create issue."));
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
          className="flex max-h-[88vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[24px] border border-[#e5e7eb] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
        >
          <header className="border-b border-[#edf0f3] px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9aa4b2]">
                  Product Data Workflow
                </p>
                <h2 className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[#111827]">
                  {title}
                </h2>
                <p className="mt-2 text-[13px] text-[#6b7280]">
                  Raise a structured issue so the product team can correct the ERP item and close the loop.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !submitting && onClose?.()}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#e5e7eb] text-[#6b7280] transition hover:border-[#111827] hover:text-[#111827]"
                aria-label="Close issue dialog"
              >
                ×
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#edf0f3] bg-[#f8fafc] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                Product
              </p>
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

          {createdIssue ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#ecfdf3] text-[28px] text-[#16a34a]">
                ✓
              </div>
              <h3 className="text-[22px] font-semibold text-[#111827]">Issue submitted</h3>
              <p className="mt-2 max-w-[440px] text-[14px] leading-6 text-[#667085]">
                The product team can now review this issue, fix the item in ERP, and close the workflow from the product data queue.
              </p>
              <div className="mt-5 rounded-full border border-[#dbe5ef] bg-[#f8fafc] px-4 py-2 text-[13px] font-semibold text-[#111827]">
                Issue #{createdIssue.id}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onClose?.()}
                  className="h-11 rounded-xl border border-[#dbe5ef] px-5 text-[13px] font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfcfe] px-6 py-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Issue Type" required>
                    <select
                      value={form.issue_type}
                      onChange={(event) => updateField("issue_type", event.target.value)}
                      className={inputClassName}
                    >
                      {PRODUCT_DATA_ISSUE_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Severity" required>
                    <select
                      value={form.severity}
                      onChange={(event) => updateField("severity", event.target.value)}
                      className={inputClassName}
                    >
                      {PRODUCT_DATA_ISSUE_SEVERITIES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label="Affected Field / Spec">
                    <select
                      value={form.affected_field}
                      onChange={(event) => updateField("affected_field", event.target.value)}
                      className={inputClassName}
                    >
                      <option value="">Select a field</option>
                      {PRODUCT_DATA_AFFECTED_FIELDS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {form.affected_field && form.affected_field !== "other" && (
                  <div className="mt-4 rounded-2xl border border-[#e5ebf2] bg-white px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                      Current Value
                    </p>
                    <p className="mt-1 text-[13px] text-[#344054]">
                      {currentValue || `No current value found for ${formatIssueLabel(PRODUCT_DATA_AFFECTED_FIELDS, form.affected_field, "this field")}.`}
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <Field label="Describe the issue" required>
                    <textarea
                      value={form.description}
                      onChange={(event) => updateField("description", event.target.value)}
                      rows={5}
                      placeholder="Explain what is wrong, incomplete, or needs correction."
                      className={`${inputClassName} min-h-[140px] resize-y py-3`}
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label="Suggested correction">
                    <textarea
                      value={form.suggested_value}
                      onChange={(event) => updateField("suggested_value", event.target.value)}
                      rows={3}
                      placeholder="Optional: suggest the correct value, note what should be added, or mention who should review it."
                      className={`${inputClassName} min-h-[96px] resize-y py-3`}
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label="Attachment">
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xlsx,.csv,.txt"
                      onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                      className="block w-full rounded-xl border border-dashed border-[#d8e0ea] bg-white px-4 py-3 text-[13px] text-[#475467]"
                    />
                    <p className="mt-2 text-[12px] text-[#98a2b3]">
                      Optional screenshot or supporting file if it helps the product team.
                    </p>
                  </Field>
                </div>
              </div>

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f3] bg-white px-6 py-4">
                <div className="text-[12px] text-[#98a2b3]">
                  Required fields: issue type, severity, and description.
                </div>
                <div className="flex items-center gap-3">
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
                    {submitting ? "Submitting..." : "Submit issue"}
                  </button>
                </div>
              </footer>
            </form>
          )}
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
