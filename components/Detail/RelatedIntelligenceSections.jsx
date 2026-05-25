import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { check_Image, get_product_manufacture_items } from "@/libs/api";

const CARD_LIMIT = 8;
const MANUFACTURE_MODAL_PAGE_SIZE = 20;

function ProductMiniCard({ item, onClick }) {
  const hasPromo = Number(item?.offer_rate || 0) > 0 && Number(item?.rate || 0) > Number(item?.offer_rate || 0);
  const image = check_Image(item?.website_image_url || item?.image || "");

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="flex w-[78vw] min-w-[170px] max-w-[220px] flex-none snap-start flex-col rounded-[14px] border border-[#ececf0] bg-white p-2.5 text-left transition hover:border-[#111827] hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)] sm:w-[190px] sm:min-w-[190px]"
    >
      <div className="relative mb-2 h-[88px] w-full overflow-hidden rounded-[10px] bg-[#fafafa]">
        {!!image && (
          <Image
            src={image}
            alt={item?.item_name || item?.item_code || "item"}
            fill
            className="object-contain p-2"
          />
        )}
      </div>
      <p className="line-clamp-1 font-mono text-[11px] font-semibold text-[#111827]">{item?.item_code || "-"}</p>
      <p className="line-clamp-2 min-h-[32px] text-[11px] leading-[1.3] text-[#4b5563]">{item?.item_name || "-"}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className={`text-[10px] font-semibold ${Number(item?.stock || 0) > 0 ? "text-[#15803d]" : "text-[#b91c1c]"}`}>
          {Number(item?.stock || 0) > 0 ? `${Number(item?.stock || 0)} ${item?.stock_uom || "Nos"}` : "Out of stock"}
        </span>
        <span className="text-[10px] font-semibold text-[#111827]">
          {hasPromo ? Number(item?.offer_rate || 0).toFixed(2) : Number(item?.rate || 0).toFixed(2)}
        </span>
      </div>
    </button>
  );
}

function SectionHeader({ title, count, onSeeMore, seeMoreLabel = "See more" }) {
  return (
    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
      <h4 className="min-w-0 flex-1 text-[13px] font-semibold text-[#111827]">
        {title}
        {count > 0 ? <span className="ml-1 text-[11px] font-medium text-[#6b7280]">({count})</span> : null}
      </h4>
      {onSeeMore ? (
        <button
          type="button"
          onClick={onSeeMore}
          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#111827] hover:text-[#6b7280] transition-colors"
        >
          {seeMoreLabel}
          <span className="text-[13px] leading-none">›</span>
        </button>
      ) : null}
    </div>
  );
}

function ManufactureGridCard({ item, onClick }) {
  const hasPromo = Number(item?.offer_rate || 0) > 0 && Number(item?.rate || 0) > Number(item?.offer_rate || 0);
  const image = check_Image(item?.website_image_url || item?.image || "");
  const qty = Number(item?.qty || 0);
  const entryCount = Number(item?.entry_count || 0);

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="flex min-w-0 flex-col rounded-[10px] border border-[#e5e7eb] bg-white p-2 text-left transition hover:border-[#111827]"
    >
      <div className="relative mb-2 h-[90px] w-full overflow-hidden rounded-[8px] bg-[#f3f5f8]">
        {!!image && (
          <Image
            src={image}
            alt={item?.item_name || item?.item_code || "item"}
            fill
            className="object-contain p-2"
          />
        )}
      </div>
      <p className="truncate font-mono text-[11px] font-semibold text-[#111827]">{item?.item_code || "-"}</p>
      <p className="line-clamp-2 min-h-[30px] text-[11px] leading-[1.35] text-[#4b5563]">{item?.item_name || "-"}</p>
      <div className="mt-1 grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <p className="text-[#9ca3af]">Qty</p>
          <p className="font-semibold text-[#111827]">{qty.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[#9ca3af]">Entries</p>
          <p className="font-semibold text-[#111827]">{entryCount}</p>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className={`text-[10px] font-semibold ${Number(item?.stock || 0) > 0 ? "text-[#15803d]" : "text-[#b91c1c]"}`}>
          {Number(item?.stock || 0) > 0 ? `${Number(item?.stock || 0)} ${item?.stock_uom || "Nos"}` : "Out of stock"}
        </span>
        <span className="text-[10px] font-semibold text-[#111827]">
          {hasPromo ? Number(item?.offer_rate || 0).toFixed(2) : Number(item?.rate || 0).toFixed(2)}
        </span>
      </div>
    </button>
  );
}

function aggregateManufactureItems(entries = []) {
  const map = new Map();
  (entries || []).forEach((entry) => {
    const stockEntryId = entry?.stock_entry || "";
    (entry?.items || []).forEach((item) => {
      const itemCode = item?.item_code;
      if (!itemCode) return;
      if (!map.has(itemCode)) {
        map.set(itemCode, {
          ...item,
          qty: Number(item?.qty || 0),
          entry_count: stockEntryId ? 1 : 0,
          _entry_ids: stockEntryId ? new Set([stockEntryId]) : new Set(),
        });
        return;
      }
      const current = map.get(itemCode);
      current.qty = Number(current.qty || 0) + Number(item?.qty || 0);
      if (stockEntryId && !current._entry_ids.has(stockEntryId)) {
        current._entry_ids.add(stockEntryId);
        current.entry_count = Number(current.entry_count || 0) + 1;
      }
      if (!current.image && item?.image) current.image = item.image;
      if (!current.website_image_url && item?.website_image_url) current.website_image_url = item.website_image_url;
      current.in_stock = current.in_stock || item.in_stock ? 1 : 0;
      current.stock = Math.max(Number(current.stock || 0), Number(item?.stock || 0));
    });
  });
  return Array.from(map.values())
    .map((item) => {
      const { _entry_ids, ...rest } = item;
      return rest;
    })
    .sort((left, right) => String(left?.item_name || left?.item_code || "").localeCompare(String(right?.item_name || right?.item_code || "")));
}

function ManufactureModal({ open, onClose, itemCode, onOpenProduct }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({
    total_distinct_items: 0,
    total_stock_entries: 0,
  });

  const loadItems = async () => {
    if (!itemCode) return;
    setLoading(true);
    setError("");
    try {
      const allEntries = [];
      let nextPage = 1;
      let totalPages = 1;
      let totalStockEntries = 0;

      while (nextPage <= totalPages) {
        const response = await get_product_manufacture_items(itemCode, nextPage, 100);
        allEntries.push(...(response?.entries || []));
        totalPages = Number(response?.pagination?.total_pages || 1);
        totalStockEntries = Number(response?.summary?.total_stock_entries || 0);
        nextPage += 1;
      }

      const dedupedItems = aggregateManufactureItems(allEntries);
      setItems(dedupedItems);
      setSummary({
        total_distinct_items: dedupedItems.length,
        total_stock_entries: totalStockEntries,
      });
      setPage(1);
    } catch (err) {
      setError(err?.message || "Unable to load manufacture items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadItems();
  }, [open, itemCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((items?.length || 0) / MANUFACTURE_MODAL_PAGE_SIZE)),
    [items]
  );
  const visibleItems = useMemo(() => {
    const start = (page - 1) * MANUFACTURE_MODAL_PAGE_SIZE;
    return (items || []).slice(start, start + MANUFACTURE_MODAL_PAGE_SIZE);
  }, [items, page]);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[980px] rounded-[14px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[#111827]">Manufactured Related Items</h3>
            <p className="text-[11px] text-[#6b7280]">
              {summary?.total_distinct_items || 0} unique items · from {summary?.total_stock_entries || 0} manufacture entries
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#d1d5db] px-3 py-1 text-[11px] font-semibold text-[#374151] hover:border-[#111827] hover:text-[#111827]"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
          {loading ? <p className="text-[12px] text-[#6b7280]">Loading manufacture entries...</p> : null}
          {!loading && error ? <p className="text-[12px] text-[#b91c1c]">{error}</p> : null}

          {!loading && !error && (!items || items.length === 0) ? (
            <p className="text-[12px] text-[#6b7280]">No manufactured related items found for this item.</p>
          ) : null}

          {!loading && !error && items?.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => (
                <ManufactureGridCard
                  key={`manufacture-item-${item.item_code}`}
                  item={item}
                  onClick={onOpenProduct}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-[#e5e7eb] px-4 py-3">
          <p className="text-[11px] text-[#6b7280]">
            Page {page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!hasPrev || loading}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              className="rounded-[8px] border border-[#d1d5db] px-3 py-1 text-[11px] font-semibold text-[#374151] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={!hasNext || loading}
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              className="rounded-[8px] border border-[#d1d5db] px-3 py-1 text-[11px] font-semibold text-[#374151] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="w-[190px] flex-none rounded-[14px] border border-[#ececf0] bg-white p-2.5">
          <div className="mb-2 h-[88px] w-full animate-pulse rounded-[10px] bg-slate-200" />
          <div className="mb-1 h-3 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function EmptyRow({ label = "No products available" }) {
  return (
    <div className="flex items-center justify-center rounded-[12px] border border-dashed border-[#e2e6ec] bg-[#fafbfc] px-4 py-7 text-center">
      <p className="text-[12px] font-medium text-[#9ca3af]">{label}</p>
    </div>
  );
}

export default function RelatedIntelligenceSections({
  itemCode,
  relatedContext,
  onOpenProduct,
  className = "",
  loading = false,
}) {
  const router = useRouter();
  const [manufactureModalOpen, setManufactureModalOpen] = useState(false);
  const rowRefs = useRef({});

  const context = relatedContext || {};
  const relatedCategory = context.related_category || {};
  const relatedSeries = context.related_series || {};
  const manufacturePreview = context.manufacture_preview || {};
  const relatedItemsCtx = context.related_items || {};
  const relatedItemGroups = Array.isArray(relatedItemsCtx.groups)
    ? relatedItemsCtx.groups
    : [];

  const handleOpenProduct = (item) => {
    if (typeof onOpenProduct === "function") {
      onOpenProduct(item);
      return;
    }
    const code = item?.item_code || item?.name;
    if (code) router.push(`/pr/${code}`);
  };

  const scrollSectionNext = (sectionKey) => {
    const row = rowRefs.current[sectionKey];
    if (!row) return;
    const delta = Math.max(row.clientWidth * 0.9, 220);
    row.scrollBy({ left: delta, behavior: "smooth" });
  };

  // These three always render — with a loading skeleton while fetching and an
  // empty placeholder when there's nothing to show.
  const fixedSections = [
    {
      key: "related-category",
      title: "Related Category",
      total: Number(relatedCategory.total || 0),
      items: (relatedCategory.items || []).slice(0, CARD_LIMIT),
      onSeeMore:
        relatedCategory.value && relatedCategory.filter_field
          ? () =>
              router.push({
                pathname: "/list",
                query: { [relatedCategory.filter_field]: relatedCategory.value },
              })
          : null,
    },
    {
      key: "related-series",
      title: "Related Series",
      total: Number(relatedSeries.total || 0),
      items: (relatedSeries.items || []).slice(0, CARD_LIMIT),
      onSeeMore: relatedSeries.value
        ? () =>
            router.push({
              pathname: "/list",
              query: { series: relatedSeries.value },
            })
        : null,
    },
    {
      key: "manufacture",
      title: "Manufactured",
      total: Number(manufacturePreview.total_distinct_items || 0),
      items: (manufacturePreview.items || []).slice(0, CARD_LIMIT),
      onSeeMore:
        Number(manufacturePreview.total_stock_entries || 0) > 0
          ? () => setManufactureModalOpen(true)
          : null,
      seeMoreLabel: "See all entries",
    },
  ];

  // Related Items (custom doctype), grouped by Type. Show each non-empty group;
  // if there are none, surface one empty "Related Items" placeholder so the
  // section is still discoverable.
  const relatedItemSections = relatedItemGroups
    .filter((group) => Array.isArray(group.items) && group.items.length > 0)
    .map((group) => ({
      key: `related-items-${group.type}`,
      title: group.type || "Related Item",
      total: Number(group.total || 0),
      items: (group.items || []).slice(0, CARD_LIMIT),
      onSeeMore: null,
    }));

  const relatedItemsToRender = relatedItemSections.length
    ? relatedItemSections
    : [
        {
          key: "related-items-empty",
          title: "Related Items",
          total: 0,
          items: [],
          onSeeMore: null,
        },
      ];

  const sections = [...fixedSections, ...relatedItemsToRender];

  return (
    <div className={`min-w-0 space-y-3 overflow-x-hidden ${className}`}>
      {sections.map((section) => (
        <div
          key={section.key}
          className="min-w-0 overflow-x-hidden rounded-[16px] border border-[#ececf0] bg-white p-4"
        >
          <SectionHeader
            title={section.title}
            count={loading ? 0 : section.total}
            onSeeMore={loading ? null : section.onSeeMore}
            seeMoreLabel={section.seeMoreLabel}
          />
          {loading ? (
            <SkeletonRow />
          ) : section.items.length > 0 ? (
            <div
              ref={(node) => {
                rowRefs.current[section.key] = node;
              }}
              className="scrollbarHide flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1"
            >
              {section.items.map((item) => (
                <ProductMiniCard
                  key={`${section.key}-${item.item_code}`}
                  item={item}
                  onClick={handleOpenProduct}
                />
              ))}
              {section.items.length > 3 && (
                <button
                  type="button"
                  onClick={() => scrollSectionNext(section.key)}
                  className="flex h-[160px] w-[42px] flex-none items-center justify-center self-center rounded-[10px] border border-[#dbe5ef] bg-white text-[#334155] transition hover:border-[#111827] hover:text-[#111827]"
                  aria-label={`Show more ${section.title}`}
                  title={`Show more ${section.title}`}
                >
                  <span className="text-[20px] leading-none">›</span>
                </button>
              )}
            </div>
          ) : (
            <EmptyRow />
          )}
        </div>
      ))}

      <ManufactureModal
        open={manufactureModalOpen}
        onClose={() => setManufactureModalOpen(false)}
        itemCode={itemCode}
        onOpenProduct={handleOpenProduct}
      />
    </div>
  );
}
