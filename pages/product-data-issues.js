import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  addProductDataIssueComment,
  extractFrappeErrorMessage,
  getErpDeskItemUrl,
  getErpDeskProductDataIssueUrl,
  getProductDataIssue,
  isProductDataManager,
  listProductDataIssues,
  reopenProductDataIssue,
  updateProductDataIssue,
} from "@/libs/api";
import {
  PRODUCT_DATA_AFFECTED_FIELDS,
  PRODUCT_DATA_ISSUE_SEVERITIES,
  PRODUCT_DATA_ISSUE_STATUSES,
  PRODUCT_DATA_ISSUE_TYPES,
  formatIssueLabel,
  getIssueSummaryCounts,
  getProductIssueStatusMeta,
} from "@/components/ProductDataIssues/shared";

const RootLayout = dynamic(() => import("@/layouts/RootLayout"));
const MobileHeader = dynamic(() => import("@/components/Headers/mobileHeader/MobileHeader"));

const DEFAULT_FILTERS = {
  item_code: "",
  status: "",
  severity: "",
  issue_type: "",
  affected_field: "",
};

export default function ProductDataIssuesPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [issuesState, setIssuesState] = useState({ loading: true, items: [], summary: {} });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [mineOnly, setMineOnly] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [detailState, setDetailState] = useState({ loading: false, issue: null, comments: [] });
  const [commentDraft, setCommentDraft] = useState("");
  const [managerDraft, setManagerDraft] = useState({
    status: "",
    assigned_to: "",
    resolution_notes: "",
    severity: "",
  });
  const [busyAction, setBusyAction] = useState("");

  const canManage = useMemo(() => isProductDataManager(), [hydrated]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    setFilters((current) => ({
      ...current,
      item_code: typeof router.query.item_code === "string" ? router.query.item_code : current.item_code,
    }));
    if (router.query.mine === "0") {
      setMineOnly(false);
    } else if (router.query.mine === "1") {
      setMineOnly(true);
    }
  }, [router.isReady, router.query.item_code, router.query.mine]);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;

    const loadIssues = async () => {
      setIssuesState((current) => ({ ...current, loading: true }));
      try {
        const response = await listProductDataIssues({
          ...filters,
          mine: mineOnly ? 1 : 0,
          page_length: 100,
        });

        if (!active) return;

        setIssuesState({
          loading: false,
          items: response.items || [],
          summary:
            response.summary && Object.keys(response.summary).length > 0
              ? response.summary
              : getIssueSummaryCounts(response.items || []),
        });

        if (!selectedId && response.items?.[0]?.id) {
          setSelectedId(response.items[0].id);
        }
      } catch (error) {
        if (!active) return;
        setIssuesState({ loading: false, items: [], summary: {} });
        toast.error(error?.message || "Unable to load product issues.");
      }
    };

    loadIssues();
    return () => {
      active = false;
    };
  }, [hydrated, filters, mineOnly, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setDetailState({ loading: false, issue: null, comments: [] });
      return;
    }

    let active = true;

    const loadDetail = async () => {
      setDetailState((current) => ({ ...current, loading: true }));
      try {
        const response = await getProductDataIssue(selectedId);
        if (!active) return;

        const issue = response?.issue || null;
        setDetailState({
          loading: false,
          issue,
          comments: response?.comments || [],
        });
        setManagerDraft({
          status: issue?.status || "open",
          assigned_to: issue?.assigned_to || "",
          resolution_notes: issue?.resolution_notes || "",
          severity: issue?.severity || "medium",
        });
      } catch (error) {
        if (!active) return;
        setDetailState({ loading: false, issue: null, comments: [] });
        toast.error(error?.message || "Unable to load issue detail.");
      }
    };

    loadDetail();
    return () => {
      active = false;
    };
  }, [selectedId]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const refreshAll = async (nextSelectedId = selectedId) => {
    const response = await listProductDataIssues({
      ...filters,
      mine: mineOnly ? 1 : 0,
      page_length: 100,
    });
    setIssuesState({
      loading: false,
      items: response.items || [],
      summary:
        response.summary && Object.keys(response.summary).length > 0
          ? response.summary
          : getIssueSummaryCounts(response.items || []),
    });

    const chosenId =
      nextSelectedId && response.items?.some((item) => item.id === nextSelectedId)
        ? nextSelectedId
        : response.items?.[0]?.id || "";
    setSelectedId(chosenId);
  };

  const handleAddComment = async () => {
    if (!detailState.issue?.id || !commentDraft.trim()) return;
    setBusyAction("comment");
    try {
      const response = await addProductDataIssueComment({
        issue_id: detailState.issue.id,
        comment: commentDraft.trim(),
      });
      setDetailState((current) => ({
        ...current,
        issue: response?.issue || current.issue,
        comments: response?.comments || current.comments,
      }));
      setCommentDraft("");
      await refreshAll(detailState.issue.id);
      toast.success("Comment added.");
    } catch (error) {
      toast.error(extractFrappeErrorMessage(error, "Unable to add comment."));
    } finally {
      setBusyAction("");
    }
  };

  const handleManagerSave = async () => {
    if (!detailState.issue?.id) return;
    setBusyAction("save");
    try {
      const response = await updateProductDataIssue(detailState.issue.id, managerDraft);
      setDetailState((current) => ({
        ...current,
        issue: response?.issue || current.issue,
        comments: response?.comments || current.comments,
      }));
      await refreshAll(detailState.issue.id);
      toast.success("Issue updated.");
    } catch (error) {
      toast.error(extractFrappeErrorMessage(error, "Unable to update issue."));
    } finally {
      setBusyAction("");
    }
  };

  const handleReopen = async () => {
    if (!detailState.issue?.id) return;
    setBusyAction("reopen");
    try {
      const response = await reopenProductDataIssue(detailState.issue.id, {
        comment: commentDraft.trim(),
      });
      setDetailState((current) => ({
        ...current,
        issue: response?.issue || current.issue,
        comments: response?.comments || current.comments,
      }));
      setCommentDraft("");
      await refreshAll(detailState.issue.id);
      toast.success("Issue reopened.");
    } catch (error) {
      toast.error(extractFrappeErrorMessage(error, "Unable to reopen issue."));
    } finally {
      setBusyAction("");
    }
  };

  const summary = issuesState.summary || {};
  const selectedStatusMeta = getProductIssueStatusMeta(detailState.issue?.status || "open");

  return (
    <RootLayout>
      <MobileHeader back_btn={true} />
      <main className="min-h-screen bg-[#f8fafc] pb-10 pt-4 md:pt-8">
        <div className="mx-auto max-w-[1380px] px-4 md:px-6">
          <div className="rounded-[26px] border border-[#e8edf3] bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)] md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                  Workflow
                </p>
                <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-[#111827]">
                  Product Data Issues
                </h1>
                <p className="mt-2 max-w-[760px] text-[14px] leading-6 text-[#667085]">
                  Raise, triage, correct, and close product data issues without leaving the catalog workflow.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMineOnly(false)}
                  className={`h-11 rounded-xl px-4 text-[13px] font-semibold transition ${
                    !mineOnly
                      ? "bg-[#111827] text-white"
                      : "border border-[#dbe5ef] bg-white text-[#475467] hover:bg-[#f8fafc]"
                  }`}
                >
                  All requests
                </button>
                <button
                  type="button"
                  onClick={() => setMineOnly(true)}
                  className={`h-11 rounded-xl px-4 text-[13px] font-semibold transition ${
                    mineOnly
                      ? "bg-[#111827] text-white"
                      : "border border-[#dbe5ef] bg-white text-[#475467] hover:bg-[#f8fafc]"
                  }`}
                >
                  My requests
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <SummaryCard label="Total" value={summary.total || issuesState.items.length || 0} />
              <SummaryCard label="Open" value={summary.open || 0} />
              <SummaryCard label="Triaged" value={summary.triaged || 0} />
              <SummaryCard label="In Progress" value={summary.in_progress || 0} />
              <SummaryCard label="Fixed" value={summary.fixed || 0} />
              <SummaryCard label="Reopened" value={summary.reopened || 0} />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <SearchField
                label="Product"
                value={filters.item_code}
                onChange={(value) => handleFilterChange("item_code", value)}
                placeholder="Search SKU"
              />
              <SelectField
                label="Status"
                value={filters.status}
                onChange={(value) => handleFilterChange("status", value)}
                options={PRODUCT_DATA_ISSUE_STATUSES}
              />
              <SelectField
                label="Severity"
                value={filters.severity}
                onChange={(value) => handleFilterChange("severity", value)}
                options={PRODUCT_DATA_ISSUE_SEVERITIES}
              />
              <SelectField
                label="Issue Type"
                value={filters.issue_type}
                onChange={(value) => handleFilterChange("issue_type", value)}
                options={PRODUCT_DATA_ISSUE_TYPES}
              />
              <SelectField
                label="Affected Field"
                value={filters.affected_field}
                onChange={(value) => handleFilterChange("affected_field", value)}
                options={PRODUCT_DATA_AFFECTED_FIELDS}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <section className="rounded-[24px] border border-[#e8edf3] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between border-b border-[#eef2f6] px-5 py-4">
                <div>
                  <h2 className="text-[16px] font-semibold text-[#111827]">
                    {mineOnly ? "My reported issues" : "Shared issue queue"}
                  </h2>
                  <p className="mt-1 text-[12px] text-[#98a2b3]">
                    {issuesState.items.length} visible issue{issuesState.items.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="max-h-[72vh] overflow-y-auto">
                {issuesState.loading ? (
                  <div className="space-y-3 p-5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="h-[86px] animate-pulse rounded-2xl bg-[#f8fafc]" />
                    ))}
                  </div>
                ) : issuesState.items.length === 0 ? (
                  <div className="px-5 py-14 text-center">
                    <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#f8fafc] text-[#98a2b3]">
                      !
                    </div>
                    <h3 className="text-[15px] font-semibold text-[#111827]">No issues found</h3>
                    <p className="mt-2 text-[13px] text-[#98a2b3]">
                      Adjust filters or raise a new issue from a product page.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {issuesState.items.map((issue) => {
                      const statusMeta = getProductIssueStatusMeta(issue.status);
                      return (
                        <button
                          key={issue.id}
                          type="button"
                          onClick={() => setSelectedId(issue.id)}
                          className={`w-full rounded-[20px] border px-4 py-4 text-left transition ${
                            selectedId === issue.id
                              ? "border-[#111827] bg-[#111827] text-white shadow-[0_18px_30px_rgba(15,23,42,0.18)]"
                              : "border-[#ebeff4] bg-white hover:border-[#d0d9e3] hover:bg-[#fbfcfe]"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${selectedId === issue.id ? "bg-white/14 text-white" : statusMeta.className}`}>
                                  {formatIssueLabel(PRODUCT_DATA_ISSUE_STATUSES, issue.status, issue.status)}
                                </span>
                                <span className={`text-[12px] font-semibold ${selectedId === issue.id ? "text-white/90" : "text-[#111827]"}`}>
                                  {issue.id}
                                </span>
                              </div>
                              <h3 className={`mt-2 text-[15px] font-semibold ${selectedId === issue.id ? "text-white" : "text-[#111827]"}`}>
                                {issue.item_code} {issue.item_name_snapshot ? `· ${issue.item_name_snapshot}` : ""}
                              </h3>
                              <p className={`mt-1 line-clamp-2 text-[13px] leading-6 ${selectedId === issue.id ? "text-white/78" : "text-[#667085]"}`}>
                                {issue.description}
                              </p>
                            </div>
                            <div className={`text-right text-[11px] ${selectedId === issue.id ? "text-white/75" : "text-[#98a2b3]"}`}>
                              <p>{formatIssueLabel(PRODUCT_DATA_ISSUE_TYPES, issue.issue_type, issue.issue_type)}</p>
                              <p className="mt-1">{formatIssueLabel(PRODUCT_DATA_ISSUE_SEVERITIES, issue.severity, issue.severity)}</p>
                              <p className="mt-1">{formatDate(issue.created_at)}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <aside className="rounded-[24px] border border-[#e8edf3] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
              {detailState.loading ? (
                <div className="space-y-3 p-5">
                  <div className="h-8 w-40 animate-pulse rounded-xl bg-[#f4f6f8]" />
                  <div className="h-24 animate-pulse rounded-2xl bg-[#f8fafc]" />
                  <div className="h-56 animate-pulse rounded-2xl bg-[#f8fafc]" />
                </div>
              ) : !detailState.issue ? (
                <div className="px-5 py-14 text-center">
                  <h3 className="text-[16px] font-semibold text-[#111827]">Select an issue</h3>
                  <p className="mt-2 text-[13px] text-[#98a2b3]">
                    Choose an item from the queue to inspect its details, comments, and actions.
                  </p>
                </div>
              ) : (
                <div className="flex max-h-[72vh] flex-col">
                  <div className="border-b border-[#eef2f6] px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${selectedStatusMeta.className}`}>
                            {formatIssueLabel(PRODUCT_DATA_ISSUE_STATUSES, detailState.issue.status, detailState.issue.status)}
                          </span>
                          <span className="text-[12px] font-semibold text-[#98a2b3]">
                            {detailState.issue.id}
                          </span>
                        </div>
                        <h2 className="mt-3 text-[18px] font-semibold text-[#111827]">
                          {detailState.issue.item_code}
                        </h2>
                        {detailState.issue.item_name_snapshot && (
                          <p className="mt-1 text-[13px] text-[#667085]">
                            {detailState.issue.item_name_snapshot}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {detailState.issue.item_code && (
                          <a
                            href={getErpDeskItemUrl(detailState.issue.item_code)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-10 items-center rounded-xl border border-[#dbe5ef] px-4 text-[12px] font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
                          >
                            ERP Item
                          </a>
                        )}
                        <a
                          href={getErpDeskProductDataIssueUrl(detailState.issue.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center rounded-xl border border-[#dbe5ef] px-4 text-[12px] font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
                        >
                          ERP Issue
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoCard label="Issue Type" value={formatIssueLabel(PRODUCT_DATA_ISSUE_TYPES, detailState.issue.issue_type, detailState.issue.issue_type)} />
                      <InfoCard label="Severity" value={formatIssueLabel(PRODUCT_DATA_ISSUE_SEVERITIES, detailState.issue.severity, detailState.issue.severity)} />
                      <InfoCard label="Affected Field" value={formatIssueLabel(PRODUCT_DATA_AFFECTED_FIELDS, detailState.issue.affected_field, detailState.issue.affected_field)} />
                      <InfoCard label="Reporter" value={detailState.issue.reporter_name || detailState.issue.reporter_user || "-"} />
                    </div>

                    <BlockCard title="Description" className="mt-4">
                      <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#475467]">
                        {detailState.issue.description || "-"}
                      </p>
                    </BlockCard>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <BlockCard title="Current value">
                        <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#475467]">
                          {detailState.issue.current_value_snapshot || "-"}
                        </p>
                      </BlockCard>
                      <BlockCard title="Suggested correction">
                        <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#475467]">
                          {detailState.issue.suggested_value || "-"}
                        </p>
                      </BlockCard>
                    </div>

                    {detailState.issue.attachment && (
                      <BlockCard title="Attachment" className="mt-4">
                        <a
                          href={detailState.issue.attachment}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[13px] font-semibold text-[#1d4ed8] underline underline-offset-4"
                        >
                          Open attachment
                        </a>
                      </BlockCard>
                    )}

                    {canManage && (
                      <BlockCard title="Manager Actions" className="mt-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <SelectField
                            label="Status"
                            value={managerDraft.status}
                            onChange={(value) => setManagerDraft((current) => ({ ...current, status: value }))}
                            options={PRODUCT_DATA_ISSUE_STATUSES}
                          />
                          <SelectField
                            label="Severity"
                            value={managerDraft.severity}
                            onChange={(value) => setManagerDraft((current) => ({ ...current, severity: value }))}
                            options={PRODUCT_DATA_ISSUE_SEVERITIES}
                          />
                        </div>
                        <div className="mt-3">
                          <FieldLabel label="Assigned To" />
                          <input
                            value={managerDraft.assigned_to}
                            onChange={(event) =>
                              setManagerDraft((current) => ({
                                ...current,
                                assigned_to: event.target.value,
                              }))
                            }
                            placeholder="User email or ERP user ID"
                            className={inputClassName}
                          />
                        </div>
                        <div className="mt-3">
                          <FieldLabel label="Resolution Notes" />
                          <textarea
                            value={managerDraft.resolution_notes}
                            onChange={(event) =>
                              setManagerDraft((current) => ({
                                ...current,
                                resolution_notes: event.target.value,
                              }))
                            }
                            rows={4}
                            className={`${inputClassName} min-h-[110px] resize-y py-3`}
                            placeholder="What was corrected in ERP?"
                          />
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={handleManagerSave}
                            disabled={busyAction === "save"}
                            className="inline-flex h-11 items-center rounded-xl bg-[#111827] px-5 text-[13px] font-semibold text-white transition hover:bg-black disabled:opacity-60"
                          >
                            {busyAction === "save" ? "Saving..." : "Save changes"}
                          </button>
                        </div>
                      </BlockCard>
                    )}

                    <BlockCard title="Discussion" className="mt-4">
                      <div className="space-y-3">
                        {detailState.comments.length === 0 ? (
                          <p className="text-[13px] text-[#98a2b3]">No comments yet.</p>
                        ) : (
                          detailState.comments.map((comment) => (
                            <div key={comment.id} className="rounded-2xl border border-[#edf0f3] bg-[#fbfcfe] px-4 py-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[12px] font-semibold text-[#111827]">
                                  {comment.owner || "User"}
                                </span>
                                <span className="text-[11px] text-[#98a2b3]">
                                  {formatDate(comment.created_at)}
                                </span>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-[#475467]">
                                {comment.content}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mt-4">
                        <FieldLabel label="Add Comment" />
                        <textarea
                          value={commentDraft}
                          onChange={(event) => setCommentDraft(event.target.value)}
                          rows={4}
                          className={`${inputClassName} min-h-[110px] resize-y py-3`}
                          placeholder="Add context, clarification, or closure notes."
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap justify-end gap-3">
                        {["fixed", "closed"].includes(detailState.issue.status) && (
                          <button
                            type="button"
                            onClick={handleReopen}
                            disabled={busyAction === "reopen"}
                            className="inline-flex h-11 items-center rounded-xl border border-[#dbe5ef] px-5 text-[13px] font-semibold text-[#344054] transition hover:bg-[#f8fafc] disabled:opacity-60"
                          >
                            {busyAction === "reopen" ? "Reopening..." : "Reopen issue"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleAddComment}
                          disabled={!commentDraft.trim() || busyAction === "comment"}
                          className="inline-flex h-11 items-center rounded-xl bg-[#111827] px-5 text-[13px] font-semibold text-white transition hover:bg-black disabled:opacity-60"
                        >
                          {busyAction === "comment" ? "Posting..." : "Post comment"}
                        </button>
                      </div>
                    </BlockCard>
                  </div>
                </div>
              )}
            </aside>
          </div>

        </div>
      </main>
    </RootLayout>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-[18px] border border-[#edf0f3] bg-[#fbfcfe] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">{label}</p>
      <p className="mt-2 text-[26px] font-semibold tracking-[-0.04em] text-[#111827]">{value}</p>
    </div>
  );
}

function SearchField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <FieldLabel label={label} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClassName}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <FieldLabel label={label} />
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName}>
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FieldLabel({ label }) {
  return <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">{label}</p>;
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-[18px] border border-[#edf0f3] bg-[#fbfcfe] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">{label}</p>
      <p className="mt-2 text-[13px] font-semibold text-[#111827]">{value || "-"}</p>
    </div>
  );
}

function BlockCard({ title, children, className = "" }) {
  return (
    <div className={`rounded-[22px] border border-[#edf0f3] bg-white p-4 ${className}`}>
      <h3 className="text-[14px] font-semibold text-[#111827]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

const inputClassName =
  "h-11 w-full rounded-xl border border-[#d8e0ea] bg-white px-4 text-[13px] text-[#111827] outline-none transition placeholder:text-[#98a2b3] focus:border-[#111827] focus:ring-4 focus:ring-[#111827]/5";
