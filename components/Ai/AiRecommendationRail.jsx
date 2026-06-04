import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { toast } from "react-toastify";
import {
  check_Image, find_similar_products, get_promotion_picks,
  insert_cart_items, log_suggestion,
} from "@/libs/api";

// Reusable ambient-AI suggestion rail (Part B). Self-fetching by `mode`:
//   mode="similar"   -> find_similar_products(itemCode)  (product page, search)
//   mode="promotion" -> get_promotion_picks()            (home "picks to push")
// Governed: hides itself when empty, logs impressions/clicks for CTR (Phase 4).
// One thin component every surface reuses.

function RailCard({ item, surface, blockType, onOpen, onAdd }) {
  const image = check_Image(item?.website_image_url || item?.image || "");
  const inStock = Number(item?.stock || 0) > 0;
  const rate = Number(item?.offer_rate || 0) > 0 && Number(item.offer_rate) < Number(item.rate || 0)
    ? Number(item.offer_rate) : Number(item?.rate || 0);
  const tag = item?.why || (item?.reason) || (item?.similarity ? `${Math.round(item.similarity * 100)}% match` : "");
  return (
    <div className="group flex w-[180px] min-w-[180px] flex-none snap-start flex-col rounded-[14px] border border-[#e8ecf3] bg-white p-2 transition-all duration-200 hover:border-[#1b6dff] hover:shadow-[0_10px_28px_rgba(27,109,255,0.14)]">
      <button type="button" onClick={() => onOpen(item)} className="text-left">
        <div className="relative mb-1.5 h-[92px] w-full overflow-hidden rounded-[10px] bg-gradient-to-br from-[#f7f9fc] to-[#eef3fb]">
          {!!image && <Image src={image} alt={item?.item_code || "item"} fill className="object-contain p-2 transition-transform duration-300 group-hover:scale-105" />}
        </div>
        <p className="line-clamp-1 font-mono text-[10px] font-semibold text-[#0f172a]">{item?.item_code || "-"}</p>
        <p className="line-clamp-2 min-h-[28px] text-[10px] leading-[1.3] text-[#64748b]">{item?.item_name || "-"}</p>
        {tag ? <p className="mt-0.5 line-clamp-1 rounded-[5px] bg-[#eef5ff] px-1.5 py-0.5 text-[9px] font-medium text-[#1b6dff]">{tag}</p> : null}
        <div className="mt-1.5 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 text-[9px] font-semibold ${inStock ? "text-[#15803d]" : "text-[#b91c1c]"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
            {inStock ? `${Number(item?.stock || 0)} in stock` : "Out of stock"}
          </span>
          {rate > 0 ? <span className="text-[10px] font-bold text-[#0f172a]">{rate.toFixed(2)}</span> : null}
        </div>
      </button>
      <button type="button" onClick={() => onAdd(item)} className="mt-1.5 rounded-[7px] bg-[#0f172a] px-2 py-1 text-[9.5px] font-semibold text-white transition hover:bg-[#1e293b]">+ Quote</button>
    </div>
  );
}

export default function AiRecommendationRail({ mode = "similar", itemCode = "", title, subtitle, limit = 8, surface }) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const reqRef = useRef(0);
  const blockType = mode;
  const sfc = surface || (mode === "promotion" ? "home" : "product");

  useEffect(() => {
    const runId = ++reqRef.current;
    setLoading(true);
    const fetcher = mode === "promotion"
      ? get_promotion_picks(limit)
      : (itemCode ? find_similar_products(itemCode, limit) : Promise.resolve([]));
    fetcher.then((res) => {
      if (runId !== reqRef.current) return;
      const list = Array.isArray(res) ? res : [];
      setItems(list);
      setLoading(false);
      if (list.length) log_suggestion({ surface: sfc, block_type: blockType, item_code: itemCode, action: "impression" });
    }).catch(() => { if (runId === reqRef.current) { setItems([]); setLoading(false); } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, itemCode, limit]);

  const openProduct = (item) => {
    if (!item?.item_code) return;
    log_suggestion({ surface: sfc, block_type: blockType, item_code: item.item_code, action: "click" });
    router.push(`/pr/${encodeURIComponent(item.item_code)}`);
  };
  const addToQuote = async (item) => {
    try {
      const r = await insert_cart_items({ item_code: item.item_code, qty: 1 });
      if ((r || {}).status === "success") {
        toast.success(`Added ${item.item_code} to quote`);
        window.dispatchEvent(new Event("cart-updated"));
        log_suggestion({ surface: sfc, block_type: blockType, item_code: item.item_code, action: "added_to_quote" });
      } else toast.error((r || {}).message || "Could not add to cart");
    } catch (_) { toast.error("Could not add to cart"); }
  };

  if (!loading && items.length === 0) return null; // governed: hide when empty

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-gradient-to-br from-[#1b6dff] to-[#3f86ff] text-white">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2.5l1.9 4.6 4.6 1.9-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 2.5z" /></svg>
        </span>
        <div>
          <h3 className="text-[13.5px] font-semibold text-[#0f172a]">{title || (mode === "promotion" ? "Picks to push today" : "Similar products")}</h3>
          {subtitle ? <p className="text-[10.5px] text-[#94a3b8]">{subtitle}</p> : null}
        </div>
      </div>
      {loading ? (
        <div className="flex gap-2.5 overflow-hidden">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[180px] w-[180px] flex-none animate-pulse rounded-[14px] bg-[#f1f5f9]" />)}
        </div>
      ) : (
        <div className="flex snap-x gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((it, i) => (
            <RailCard key={`${it.item_code}-${i}`} item={it} surface={sfc} blockType={blockType} onOpen={openProduct} onAdd={addToQuote} />
          ))}
        </div>
      )}
    </div>
  );
}
