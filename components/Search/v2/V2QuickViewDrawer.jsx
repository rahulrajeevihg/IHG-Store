import { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  getSimilarProductsV2,
  isSearchV2DisabledError,
  normalizeSearchHit,
  buildFeatureFlagOverride,
  reportSearchV2DisabledOnce,
  SEARCH_V2_DISABLED_DISPLAY_MESSAGE,
} from "@/libs/ighSearchV2";
import { logV2Event } from "@/libs/ighSearchV2Metrics";
import ImageLoader from "@/components/ImageLoader";
import { check_Image } from "@/libs/api";
import {
  formatHappyCustomers,
  formatLifetimeSoldQty,
  formatStarRating,
  getBusinessSignals,
} from "@/libs/businessSignals";

export default function V2QuickViewDrawer({
  open,
  item,
  detail,
  loading,
  onClose,
  onNavigate,
  onShortlist,
  onWishlist,
  isWishlisted,
  isShortlisted,
  searchV2Requested,
}) {
  const [similarState, setSimilarState] = useState({
    loading: false,
    loaded: false,
    items: [],
    error: "",
  });
  const [showSimilar, setShowSimilar] = useState(false);

  const featureFlagOverride = useMemo(
    () => buildFeatureFlagOverride(searchV2Requested),
    [searchV2Requested]
  );

  useEffect(() => {
    if (!open) {
      setShowSimilar(false);
      setSimilarState({
        loading: false,
        loaded: false,
        items: [],
        error: "",
      });
    }
  }, [open, item?.item_code]);

  useEffect(() => {
    if (!open || !showSimilar || !item?.item_code || similarState.loaded || similarState.loading) {
      return;
    }

    let active = true;
    const controller = new AbortController();

    const loadSimilar = async () => {
      setSimilarState((current) => ({
        ...current,
        loading: true,
        error: "",
      }));

      try {
        const response = await getSimilarProductsV2(
          {
            item_code: item.item_code,
            limit: 8,
            feature_flag_override: featureFlagOverride,
          },
          { signal: controller.signal }
        );

        if (!active) {
          return;
        }

        const results = Array.isArray(response?.results) ? response.results : [];
        setSimilarState({
          loading: false,
          loaded: true,
          items: results,
          error: "",
        });
        logV2Event("similar_products_loaded", {
          item_code: item.item_code,
          count: results.length,
        });
      } catch (error) {
        if (!active || error?.name === "AbortError") {
          return;
        }

        if (isSearchV2DisabledError(error)) {
          reportSearchV2DisabledOnce({
            source: "get_similar_products_v2",
            item_code: item.item_code,
          });
          setSimilarState({
            loading: false,
            loaded: true,
            items: [],
            error: SEARCH_V2_DISABLED_DISPLAY_MESSAGE,
          });
          return;
        }

        setSimilarState({
          loading: false,
          loaded: true,
          items: [],
          error: error?.message || "Unable to load similar products.",
        });
        logV2Event("similar_products_failed", {
          item_code: item.item_code,
          message: error?.message || "Unable to load similar products.",
        });
      }
    };

    loadSimilar();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    open,
    showSimilar,
    item?.item_code,
    featureFlagOverride,
    similarState.loaded,
    similarState.loading,
  ]);

  const summary = detail || item || {};
  const businessSignals = getBusinessSignals(summary);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/45" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-6">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-[620px] bg-[linear-gradient(180deg,#fffdf8_0%,#f9f2e8_100%)] shadow-[0_32px_80px_rgba(26,18,4,0.26)]">
                  <div className="flex h-full flex-col overflow-y-auto">
                    <div className="border-b border-[#ece7de] bg-white/65 px-[22px] py-[18px] backdrop-blur">
                      <div className="flex items-start justify-between gap-[12px]">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.45px] text-[#8b7757]">
                            Quick View
                          </p>
                          <Dialog.Title className="mt-[4px] text-[24px] font-semibold text-[#181818]">
                            Product preview
                          </Dialog.Title>
                          <p className="mt-[6px] text-[13px] text-[#666]">
                            Inspect pricing, stock, and alternatives without leaving the catalog.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onClose}
                          className="grid h-[38px] w-[38px] place-items-center rounded-full border border-[#e7dac6] bg-white text-[16px] text-[#333]"
                        >
                          x
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 px-[22px] py-[20px]">
                      {loading ? (
                        <div className="space-y-[12px]">
                          <div className="h-[320px] animate-pulse rounded-[28px] bg-[#f1eadf]" />
                          <div className="h-[20px] w-[65%] animate-pulse rounded-[10px] bg-[#f1eadf]" />
                          <div className="h-[16px] w-[45%] animate-pulse rounded-[10px] bg-[#f1eadf]" />
                          <div className="h-[96px] animate-pulse rounded-[18px] bg-[#f6f0e6]" />
                        </div>
                      ) : (
                        <>
                          <div className="overflow-hidden rounded-[30px] border border-[#eadfcd] bg-[linear-gradient(180deg,#fffdf9_0%,#fff7ec_100%)] shadow-[0_20px_44px_rgba(59,39,8,0.08)]">
                            <div className="border-b border-[#efe3d2] bg-[radial-gradient(circle_at_top,_#fffefb,_#f7efe3_75%)] px-[18px] pb-[16px] pt-[18px]">
                              <div className="mb-[14px] flex h-[280px] items-center justify-center overflow-hidden rounded-[24px] border border-[#ece7de] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                                <ImageLoader
                                  height={260}
                                  width={260}
                                  src={getDetailImage(summary)}
                                  title={summary.item_name || summary.item_code || "Product image"}
                                  style="h-[260px] w-[260px] object-contain"
                                />
                              </div>

                              <div className="flex flex-wrap items-center gap-[8px]">
                                <span className="rounded-full bg-[#f0eadf] px-[10px] py-[4px] text-[11px] font-semibold uppercase tracking-[0.5px] text-[#67593f]">
                                  {summary.item_code}
                                </span>
                                {summary.is_active === 0 && (
                                  <span className="rounded-full bg-[#fbe4e2] px-[10px] py-[4px] text-[11px] font-semibold uppercase tracking-[0.5px] text-[#b42318]">
                                    Inactive
                                  </span>
                                )}
                                {summary.parent_item_code && (
                                  <span className="rounded-full bg-[#e6f0fb] px-[10px] py-[4px] text-[11px] font-semibold text-[#185ea8]">
                                    Variant of {summary.parent_item_code}
                                  </span>
                                )}
                                {summary.brand && (
                                  <span className="rounded-full bg-[#f8f1e5] px-[10px] py-[4px] text-[11px] font-semibold text-[#7a6647]">
                                    {summary.brand}
                                  </span>
                                )}
                              </div>

                              <h3 className="mt-[14px] text-[26px] font-semibold leading-[1.2] text-[#171717]">
                                {summary.item_name || summary.item || summary.name}
                              </h3>

                              {summary.spec_summary && (
                                <p className="mt-[12px] rounded-[18px] bg-white/70 px-[14px] py-[12px] text-[13px] leading-[1.7] text-[#54493c]">
                                  {summary.spec_summary}
                                </p>
                              )}
                            </div>

                            <div className="px-[18px] py-[18px]">
                              <div className="grid gap-[12px] md:grid-cols-2">
                                <div className="rounded-[22px] border border-[#eadfcd] bg-white p-[16px]">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.45px] text-[#8f7d62]">
                                    {promoActive(summary) ? "Promo Price" : "Price"}
                                  </p>
                                  <p className="mt-[6px] text-[28px] font-semibold text-[#171717]">
                                    {formatPrice(promoActive(summary) ? summary.offer_rate : summary.rate)}
                                  </p>
                                  {promoActive(summary) && (
                                    <div className="mt-[4px] flex items-center gap-[8px]">
                                      <span className="text-[13px] text-[#91867a] line-through">
                                        {formatPrice(summary.rate)}
                                      </span>
                                      <span className="rounded-full bg-[#111] px-[7px] py-[2px] text-[10px] font-semibold text-white">
                                        -{discountPct(summary)}%
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="rounded-[22px] border border-[#eadfcd] bg-white p-[16px]">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.45px] text-[#8f7d62]">
                                    Availability
                                  </p>
                                  <p className={`mt-[6px] text-[26px] font-semibold ${stockInDrawer(summary) ? "text-[#171717]" : "text-[#9ca3af]"}`}>
                                    {stockInDrawer(summary) ? (Number(summary.stock) > 0 ? Number(summary.stock) : "In") : "Out"}
                                  </p>
                                  <p className="mt-[4px] text-[13px] text-[#5f5548]">
                                    {stockInDrawer(summary)
                                      ? `In stock${Number(summary.stock) > 0 && summary.stock_uom ? `: ${summary.stock_uom}` : ""}`
                                      : "Out of stock"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-[14px] grid gap-[10px] rounded-[22px] border border-[#eadfcd] bg-white p-[16px] text-[13px] text-[#444] md:grid-cols-2">
                                <Info label="Brand" value={summary.brand || "-"} />
                                <Info
                                  label="Category"
                                  value={summary.category_list || summary.item_group || "-"}
                                />
                                <Info
                                  label="RRP"
                                  value={formatPrice(summary.rate)}
                                />
                                <Info
                                  label="Stock"
                                  value={
                                    stockInDrawer(summary)
                                      ? `${Number(summary.stock) > 0 ? `${Number(summary.stock)} ` : ""}${summary.stock_uom || "in stock"}`
                                      : "Out of stock"
                                  }
                                />
                                {summary.power && <Info label="Power" value={summary.power} />}
                                {summary.color_temp && <Info label="Color Temperature" value={summary.color_temp} />}
                                {summary.ip_rate && <Info label="IP Rating" value={summary.ip_rate} />}
                                {summary.beam_angle && <Info label="Beam Angle" value={`${summary.beam_angle}°`} />}
                                {summary.mounting && <Info label="Mounting" value={summary.mounting} />}
                                {summary.lamp_type && <Info label="Lamp Type" value={summary.lamp_type} />}
                                {summary.material && <Info label="Material" value={summary.material} />}
                                {summary.body_finish && <Info label="Body Finish" value={summary.body_finish} />}
                                {summary.input_voltage && <Info label="Input Voltage" value={summary.input_voltage} />}
                                {summary.output_voltage && <Info label="Output Voltage" value={summary.output_voltage} />}
                                {summary.output_current && <Info label="Output Current" value={summary.output_current} />}
                                {summary.warranty && <Info label="Warranty" value={summary.warranty} />}
                              </div>

                              <BusinessSignalsRow signals={businessSignals} />

                              {summary.description && (
                                <p className="mt-[14px] line-clamp-5 text-[13px] leading-[1.8] text-[#5d5d5d]">
                                  {stripHtml(summary.description)}
                                </p>
                              )}

                              <div className="mt-[18px] grid grid-cols-1 gap-[10px] sm:grid-cols-3">
                                <button
                                  type="button"
                                  onClick={() => onShortlist(summary)}
                                  className="rounded-[16px] bg-[#1b6dff] px-[14px] py-[12px] text-[13px] font-semibold text-white shadow-[0_12px_24px_rgba(27,109,255,0.24)]"
                                >
                                  {isShortlisted ? "Shortlisted" : "Shortlist for Quote"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onWishlist(summary)}
                                  className="rounded-[16px] border border-[#d8cfbf] bg-white px-[14px] py-[12px] text-[13px] font-semibold text-[#594d3a]"
                                >
                                  {isWishlisted ? "Saved" : "Save"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onNavigate(summary)}
                                  className="rounded-[16px] border border-[#d8cfbf] bg-[#fff8ec] px-[14px] py-[12px] text-[13px] font-semibold text-[#594d3a]"
                                >
                                  Open Product
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-[18px] overflow-hidden rounded-[28px] border border-[#eadfcd] bg-white shadow-[0_18px_40px_rgba(59,39,8,0.05)]">
                            <button
                              type="button"
                              onClick={() => setShowSimilar((current) => !current)}
                              className="flex w-full items-center justify-between px-[18px] py-[16px] text-left"
                            >
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.45px] text-[#8f7d62]">
                                  Recommendations
                                </p>
                                <p className="mt-[4px] text-[18px] font-semibold text-[#171717]">
                                  Similar / Alternatives
                                </p>
                                <p className="mt-[4px] text-[12px] text-[#666]">
                                  Manual alternatives appear before computed matches.
                                </p>
                              </div>
                              <span className="rounded-full bg-[#f8f1e5] px-[12px] py-[7px] text-[11px] font-semibold uppercase tracking-[0.4px] text-[#7b6d58]">
                                {showSimilar ? "Hide" : "Show"}
                              </span>
                            </button>

                            {showSimilar && (
                              <div className="border-t border-[#ece7de] px-[18px] py-[16px]">
                                {similarState.loading ? (
                                  <div className="grid gap-[12px] sm:grid-cols-2">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                      <div
                                        key={index}
                                        className="h-[220px] animate-pulse rounded-[22px] bg-[#f6f0e6]"
                                      />
                                    ))}
                                  </div>
                                ) : similarState.error ? (
                                  <p className="text-[13px] text-[#b42318]">
                                    {similarState.error}
                                  </p>
                                ) : similarState.items.length === 0 ? (
                                  <p className="text-[13px] text-[#666]">
                                    No similar products found for this item.
                                  </p>
                                ) : (
                                  <div className="grid gap-[12px] sm:grid-cols-2">
                                    {similarState.items.map((result) => {
                                      const document = normalizeSearchHit(result?.document);
                                      const isManual = result?.reason === "manual";

                                      return (
                                        <div
                                          key={`${document.item_code}-${result?.reason}`}
                                          className="overflow-hidden rounded-[24px] border border-[#efe9de] bg-[linear-gradient(180deg,#fffdfa_0%,#fff7ed_100%)]"
                                        >
                                          <div className="flex h-[150px] items-center justify-center border-b border-[#f1e7da] bg-[radial-gradient(circle_at_top,_#fffefb,_#f7efe3_75%)] p-[14px]">
                                            <ImageLoader
                                              height={130}
                                              width={130}
                                              src={getLeanHitImage(document)}
                                              title={document.item_name || document.item_code || "Product image"}
                                              style="h-[130px] w-[130px] object-contain"
                                            />
                                          </div>

                                          <div className="space-y-[10px] p-[14px]">
                                            <div className="flex items-start justify-between gap-[10px]">
                                              <span
                                                className={`rounded-full px-[10px] py-[4px] text-[11px] font-semibold ${
                                                  isManual
                                                    ? "bg-[#e9f4e8] text-[#147a3d]"
                                                    : "bg-[#eff3f8] text-[#34516f]"
                                                }`}
                                              >
                                                {isManual ? "Manual" : "Similar Match"}
                                              </span>
                                              {typeof result?.score === "number" && (
                                                <span className="text-[11px] text-[#7b6d58]">
                                                  Score {result.score.toFixed(2)}
                                                </span>
                                              )}
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => onNavigate(document)}
                                              className="text-left"
                                            >
                                              <p className="text-[12px] font-semibold uppercase tracking-[0.45px] text-[#8c7756]">
                                                {document.item_code}
                                              </p>
                                              <p className="mt-[4px] line-clamp-2 text-[14px] font-semibold text-[#1b1b1b]">
                                                {document.item_name}
                                              </p>
                                            </button>

                                            <div className="flex flex-wrap items-center gap-[8px] text-[12px] text-[#666]">
                                              {document.brand && <span>{document.brand}</span>}
                                              {document.category_list && (
                                                <span>{document.category_list}</span>
                                              )}
                                              {document.stock !== undefined && (
                                                <span>
                                                  {document.stock > 0
                                                    ? `Stock ${document.stock}`
                                                    : "Out of stock"}
                                                </span>
                                              )}
                                            </div>

                                            {document.spec_summary && (
                                              <p className="rounded-[14px] bg-white/75 px-[10px] py-[9px] text-[12px] leading-[1.6] text-[#555]">
                                                {document.spec_summary}
                                              </p>
                                            )}

                                            <div className="rounded-[14px] bg-[#faf7f2] px-[12px] py-[10px]">
                                              <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[#7b6d58]">
                                                Why this alternative
                                              </p>
                                              <p className="mt-[4px] text-[12px] leading-[1.6] text-[#555]">
                                                {buildAlternativeReason(summary, document, result?.reason)}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function promoActive(summary) {
  const offer = Number(summary?.offer_rate);
  const rate = Number(summary?.rate);
  return offer > 0 && rate > 0 && offer < rate;
}

function discountPct(summary) {
  if (Number(summary?.discount_percentage) > 0) {
    return Math.round(Number(summary.discount_percentage));
  }
  const offer = Number(summary?.offer_rate);
  const rate = Number(summary?.rate);
  return rate > 0 ? Math.round(((rate - offer) / rate) * 100) : 0;
}

function stockInDrawer(summary) {
  return summary?.in_stock === true || summary?.in_stock === 1 || Number(summary?.stock) > 0;
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.4px] text-[#867b6c]">{label}</p>
      <p className="mt-[2px] font-medium text-[#222]">{value}</p>
    </div>
  );
}

function BusinessSignalsRow({ signals }) {
  const starValue = signals?.hasStarRating ? formatStarRating(signals.starRating) : "-";
  const customerValue = signals?.hasCustomerCount
    ? formatHappyCustomers(signals.customerCount)
    : "-";
  const soldQtyValue = signals?.hasSoldQty ? formatLifetimeSoldQty(signals.soldQty) : "-";

  return (
    <div className="mt-[14px] rounded-[22px] border border-[#eadfcd] bg-white p-[16px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.45px] text-[#8f7d62]">
        Business Signals
      </p>
      <div className="mt-[10px] grid gap-[10px] text-[13px] text-[#444] md:grid-cols-3">
        <Info label="Star Rating" value={starValue} />
        <Info label="Happy Customers" value={customerValue} />
        <Info label="Qty Sold" value={soldQtyValue} />
      </div>
    </div>
  );
}

function formatPrice(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  return `AED ${numeric.toFixed(2)}`;
}

function stripHtml(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  if (typeof window === "undefined") {
    return value.replace(/<\/?[^>]+(>|$)/g, "");
  }

  const element = document.createElement("div");
  element.innerHTML = value;
  return element.textContent || element.innerText || "";
}

function resolveImageSrc(raw) {
  if (!raw || typeof raw !== "string" || raw.trim() === "") return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("http://")) return trimmed;
  return check_Image(trimmed); // relative /files/... → prepends https://erp.ihgind.com
}

// For V2 lean search hits — only `image` field is present
function getLeanHitImage(doc) {
  return resolveImageSrc(doc?.image || null);
}

// For full detail objects (after get_product_details fetch) — legacy fields may exist
function getDetailImage(doc) {
  return resolveImageSrc(
    doc?.image || doc?.website_image_url || doc?.product_image || null
  );
}

function buildAlternativeReason(source, candidate, reason) {
  const reasons = [];

  if (reason === "manual") {
    reasons.push("Manually maintained as a recommended replacement");
  } else {
    reasons.push("Computed as a close catalog match");
  }

  if (source?.category_list && candidate?.category_list && source.category_list === candidate.category_list) {
    reasons.push(`same category (${candidate.category_list})`);
  }

  if (source?.brand && candidate?.brand && source.brand === candidate.brand) {
    reasons.push(`same brand (${candidate.brand})`);
  }

  if (candidate?.stock > 0) {
    reasons.push("currently in stock");
  }

  if (candidate?.spec_summary) {
    reasons.push("similar specification profile");
  }

  return `${reasons[0]}${reasons.length > 1 ? `, with ${reasons.slice(1).join(", ")}` : ""}.`;
}
