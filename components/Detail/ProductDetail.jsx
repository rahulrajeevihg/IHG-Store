import { check_Image, get_product_details, get_product_related_context, typesense_search_items } from '@/libs/api';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import CardButton from '../Product/CardButton';
import Tabs from '../Common/Tabs';
import RelatedIntelligenceSections from './RelatedIntelligenceSections';
import {
    formatHappyCustomers,
    formatLifetimeSoldQty,
    formatStarRating,
    getBusinessSignals,
} from '@/libs/businessSignals';

const ProductDetail = ({ hide, visible, productData }) => {
    const [relatedContext, setRelatedContext] = useState(null);
    const [relatedLoading, setRelatedLoading] = useState(false);
    const [details, setDetails] = useState({});
    const [loader, setLoader] = useState(true);
    const [data, setData] = useState({});
    const [activeThumb, setActiveThumb] = useState(0);
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [zoomOpen, setZoomOpen] = useState(false);
    const [showStickyCta, setShowStickyCta] = useState(false);
    const bodyRef = useRef(null);
    const buyBoxRef = useRef(null);
    const mobileGalleryRef = useRef(null);
    const panelRef = useRef(null);

    // Trigger CSS slide-in after mount
    useEffect(() => {
        if (visible) {
            const id = requestAnimationFrame(() => setOpen(true));
            return () => cancelAnimationFrame(id);
        } else {
            setOpen(false);
        }
    }, [visible]);

    useEffect(() => {
        if (productData && productData.item_code) {
            // Show immediately with search-result data, then enrich with full Typesense doc
            setData({ ...productData });
            setLoader(false);
            setActiveThumb(0);
            fetchFullProduct(productData.item_code);
            getDetail(productData.item_code);
            fetchRelatedContext(productData.item_code);
        }
    }, [productData]);

    // Fetch the complete Typesense document to get full_description and all fields
    // (search results are trimmed; direct query returns everything)
    const fetchFullProduct = async (itemCode) => {
        try {
            const queryParams = new URLSearchParams({
                q: "*",
                filter_by: `item_code:=${itemCode}`,
                per_page: "1",
            });
            const res = await typesense_search_items(queryParams);
            const fullDoc = res.hits && res.hits.length > 0 ? res.hits[0].document : null;
            if (fullDoc) {
                setData(prev => ({ ...prev, ...fullDoc }));
            }
        } catch (e) {
            console.error('fetchFullProduct error', e);
        }
    };

    const getDetail = async (itemCode) => {
        if (!itemCode) return;
        try {
            const resp = await get_product_details(itemCode);
            const detail = (resp && resp.message) || {};
            setDetails(detail && typeof detail === "object" ? detail : {});
        } catch (e) {
            console.error('getDetail error', e);
        }
    };

    const fetchRelatedContext = async (itemCode) => {
        if (!itemCode) {
            setRelatedContext(null);
            setRelatedLoading(false);
            return;
        }
        setRelatedLoading(true);
        setRelatedContext(null);
        try {
            const context = await get_product_related_context(itemCode, 8);
            setRelatedContext(context || null);
        } catch (err) {
            console.error('fetchRelatedContext error', err);
            setRelatedContext(null);
        } finally {
            setRelatedLoading(false);
        }
    };

    const openDetail = (value) => {
        const doc = value?.document || value;
        if (doc && doc.item_code) {
            setData({ ...doc });
            setActiveThumb(0);
            setZoomOpen(false);
            setLoader(false);
            fetchFullProduct(doc.item_code);
            getDetail(doc.item_code);
            fetchRelatedContext(doc.item_code);
            if (bodyRef.current) bodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Escape to close — keep handler current so it always sees latest `hide`
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') {
                if (zoomOpen) setZoomOpen(false);
                else hide(undefined);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [hide, zoomOpen]);

    // Header elevation on scroll
    const handleBodyScroll = (e) => {
        setScrolled(e.currentTarget.scrollTop > 8);
    };

    // Show sticky CTA once the buy box scrolls out of view
    useEffect(() => {
        if (!visible || loader) return;
        const target = buyBoxRef.current;
        const root = bodyRef.current;
        if (!target || !root) return;
        const observer = new IntersectionObserver(
            ([entry]) => setShowStickyCta(!entry.isIntersecting),
            { root, threshold: 0 }
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, [visible, loader, data.item_code]);

    // Lock body scroll + move focus into the panel while open
    useEffect(() => {
        if (!visible) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const id = requestAnimationFrame(() => panelRef.current?.focus());
        return () => {
            document.body.style.overflow = prevOverflow;
            cancelAnimationFrame(id);
        };
    }, [visible]);

    if (!visible) return null;

    const galleryImages = (Array.isArray(data.images) && data.images.length > 0)
        ? data.images.map((img) => check_Image(img.detail_image || img.image)).filter(Boolean)
        : [check_Image(data.website_image_url)].filter(Boolean);

    const primaryImage = galleryImages[activeThumb] || galleryImages[0] || '/empty-states.png';

    const discountPct = data.offer_rate > 0 && data.rate > 0
        ? parseInt(((data.rate - data.offer_rate) / data.rate) * 100)
        : 0;
    const businessSignals = getBusinessSignals(data);
    const signalChips = [
        businessSignals.hasStarRating && { label: 'Rating', value: formatStarRating(businessSignals.starRating) },
        businessSignals.hasCustomerCount && { label: 'Happy Customers', value: formatHappyCustomers(businessSignals.customerCount) },
        businessSignals.hasSoldQty && { label: 'Lifetime Sold', value: formatLifetimeSoldQty(businessSignals.soldQty) },
    ].filter(Boolean);

    const stockRows = Array.isArray(details?.stock_rows)
        ? details.stock_rows
        : Array.isArray(details?.stock)
            ? details.stock
            : [];
    const totalStock = Number(
        details?.total_stock ??
            stockRows.reduce((accumulator, row) => accumulator + Number(row?.actual_qty || 0), 0)
    );
    const isInStock = details?.in_stock !== undefined ? Boolean(details.in_stock) : totalStock > 0;
    const uom = data.stock_uom || 'Nos';
    const hasPrice = data.offer_rate > 0 || data.rate > 0;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-[200] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
                onClick={() => hide(undefined)}
            />

            {/* Sheet panel — slides in from right */}
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={data.item_name || 'Product details'}
                data-tour="product-detail-panel"
                className={`fixed right-0 top-0 h-screen z-[201] bg-white flex flex-col transition-transform duration-300 ease-out w-full lg:w-[90vw] max-w-[1320px] lg:rounded-l-[24px] overflow-hidden shadow-[-24px_0_80px_rgba(15,23,42,0.22)] outline-none ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* ── Sticky header ── */}
                <div className={`flex-none flex items-center justify-between px-4 lg:px-7 h-[60px] shrink-0 transition-all duration-200 ${scrolled ? 'border-b border-[#ececf0] bg-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(15,23,42,0.04)]' : 'border-b border-transparent bg-white'}`}>
                    <button
                        onClick={() => hide(undefined)}
                        className="group flex items-center gap-2.5 text-[13px] font-medium text-[#6b7280] hover:text-[#111] transition-colors"
                    >
                        <span className="grid size-[32px] place-items-center rounded-full border border-[#e9edf2] bg-white transition-all group-hover:border-[#111] group-hover:text-[#111] group-hover:-translate-x-0.5">
                            <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                        <span className="hidden sm:inline">Back to results</span>
                    </button>

                    {data.item_code && (
                        <span className="font-mono text-[11px] tracking-[0.08em] text-[#94a3b8] hidden md:inline-flex items-center rounded-full border border-[#eef1f5] bg-[#f8fafc] px-3 py-1 select-all">
                            {data.item_code}
                        </span>
                    )}

                    <button
                        data-tour="product-detail-close"
                        onClick={() => hide(undefined)}
                        className="size-[36px] flex items-center justify-center rounded-full text-[#9ca3af] hover:bg-[#111] hover:text-white transition-colors text-[22px] leading-none"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div ref={bodyRef} onScroll={handleBodyScroll} className="flex-1 overflow-y-auto overflow-x-hidden">
                    {loader ? (
                        <SheetSkeleton />
                    ) : (
                        data && Object.keys(data).length > 0 && (
                            <>
                                {/* Top section: image | info */}
                                <div className="overflow-x-hidden lg:grid lg:grid-cols-[460px_1fr]">

                                    {/* LEFT — image panel, sticky */}
                                    <div data-tour="product-detail-images" className="hidden lg:block border-r border-[#f0f1f4]">
                                        <div className="sticky top-0 p-7 bg-white">
                                            {/* Main image stage */}
                                            <div className="relative">
                                                {discountPct > 0 && (
                                                    <div className="absolute top-3 left-3 z-10 rounded-full bg-[#111] text-white text-[10px] font-bold uppercase tracking-[0.14em] px-3 py-1.5">
                                                        SAVE {discountPct}%
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setZoomOpen(true)}
                                                    className="group relative block h-[440px] w-full rounded-[22px] border border-[#eef0f3] bg-[#fafafa] overflow-hidden cursor-zoom-in"
                                                    aria-label="Zoom image"
                                                >
                                                    <Image
                                                        src={primaryImage}
                                                        width={460}
                                                        height={460}
                                                        alt={data.item_name || 'Product'}
                                                        className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-[1.06]"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = '/empty-states.png'; }}
                                                    />
                                                    <span className="absolute bottom-3 right-3 grid size-8 place-items-center rounded-full bg-white/90 text-[#111] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M11 8v6M8 11h6" strokeLinecap="round" />
                                                        </svg>
                                                    </span>
                                                </button>
                                            </div>

                                            {/* Thumbnail strip */}
                                            {galleryImages.length > 1 && (
                                                <div className="flex gap-2.5 mt-4 overflow-x-auto scrollbarHide pb-1">
                                                    {galleryImages.map((src, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setActiveThumb(idx)}
                                                            className={`flex-none w-[64px] h-[64px] rounded-[14px] border transition-all duration-150 overflow-hidden bg-[#f7f8fa] ${activeThumb === idx ? 'border-[#111] ring-2 ring-[#111]/15' : 'border-[#e5e7eb] hover:border-[#9ca3af]'}`}
                                                        >
                                                            <Image
                                                                src={src || '/empty-states.png'}
                                                                width={64}
                                                                height={64}
                                                                alt={`View ${idx + 1}`}
                                                                className="w-full h-full object-contain p-1.5"
                                                                onError={(e) => { e.target.onerror = null; e.target.src = '/empty-states.png'; }}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* RIGHT — info panel */}
                                    <div className="min-w-0 p-5 lg:p-9">
                                        {/* Mobile swipeable gallery */}
                                        <div className="lg:hidden mb-5">
                                            <div className="relative">
                                                {discountPct > 0 && (
                                                    <div className="absolute top-3 left-3 z-10 rounded-full bg-[#111] text-white text-[9px] font-bold uppercase tracking-[0.12em] px-2.5 py-1">
                                                        SAVE {discountPct}%
                                                    </div>
                                                )}
                                                <div
                                                    ref={mobileGalleryRef}
                                                    onScroll={(e) => {
                                                        const w = e.currentTarget.clientWidth || 1;
                                                        setActiveThumb(Math.round(e.currentTarget.scrollLeft / w));
                                                    }}
                                                    className="flex snap-x snap-mandatory overflow-x-auto scrollbarHide rounded-[18px] border border-[#eef0f3] bg-[#fafafa]"
                                                >
                                                    {galleryImages.map((src, idx) => (
                                                        <div key={idx} className="snap-center shrink-0 w-full h-[260px] flex items-center justify-center">
                                                            <Image
                                                                src={src || '/empty-states.png'}
                                                                width={300}
                                                                height={260}
                                                                alt={`${data.item_name || 'Product'} ${idx + 1}`}
                                                                className="h-full w-full object-contain p-6"
                                                                onError={(e) => { e.target.onerror = null; e.target.src = '/empty-states.png'; }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {galleryImages.length > 1 && (
                                                <div className="flex items-center justify-center gap-1.5 mt-3">
                                                    {galleryImages.map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            aria-label={`Go to image ${idx + 1}`}
                                                            onClick={() => {
                                                                const el = mobileGalleryRef.current;
                                                                if (el) el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
                                                            }}
                                                            className={`h-1.5 rounded-full transition-all ${activeThumb === idx ? 'w-5 bg-[#111]' : 'w-1.5 bg-[#d1d5db]'}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div data-tour="product-detail-info">
                                            {/* Brand · Category */}
                                            {(data.brand || data.item_group) && (
                                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                                    {data.brand && <span className="inline-flex items-center rounded-full bg-[#111] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">{data.brand}</span>}
                                                    {data.item_group && <span className="inline-flex items-center rounded-full border border-[#e5e7eb] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">{data.item_group}</span>}
                                                </div>
                                            )}

                                            {/* Product name — editorial */}
                                            <h2 className="text-[26px] lg:text-[34px] font-extrabold text-[#0b0c0e] leading-[1.12] tracking-[-0.02em] capitalize">
                                                {data.item_name}
                                            </h2>
                                        </div>

                                        {/* Buy box — grouped purchase decision */}
                                        <div
                                            ref={buyBoxRef}
                                            data-tour="product-detail-price"
                                            className="mt-6 rounded-[20px] border border-[#ececf0] bg-white p-5 lg:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
                                        >
                                            {/* Price */}
                                            <div className="mb-4">
                                                {data.offer_rate > 0 ? (
                                                    <div className="flex flex-wrap items-baseline gap-3">
                                                        <span className="text-[34px] font-extrabold text-[#0b0c0e] tracking-[-0.03em] leading-none">
                                                            <span className="text-[16px] font-bold align-top mr-1 text-[#6b7280]">AED</span>
                                                            {parseFloat(data.offer_rate).toFixed(2)}
                                                        </span>
                                                        <span className="text-[17px] text-[#9ca3af] line-through">
                                                            {parseFloat(data.rate).toFixed(2)}
                                                        </span>
                                                        {discountPct > 0 && (
                                                            <span className="rounded-full bg-[#111] text-white text-[11px] font-bold px-2.5 py-1 tracking-[0.04em]">
                                                                SAVE {discountPct}%
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : data.rate > 0 ? (
                                                    <span className="text-[34px] font-extrabold text-[#0b0c0e] tracking-[-0.03em] leading-none">
                                                        <span className="text-[16px] font-bold align-top mr-1 text-[#6b7280]">AED</span>
                                                        {parseFloat(data.rate).toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[15px] text-[#9ca3af] italic">Price on request</span>
                                                )}
                                            </div>

                                            {/* Stock status */}
                                            <div data-tour="product-detail-stock-detail" className="mb-5">
                                                {isInStock ? (
                                                    <div className="inline-flex items-center gap-2 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5">
                                                        <span className="size-2 rounded-full bg-[#16a34a] shadow-[0_0_0_3px_rgba(22,163,74,0.18)]" />
                                                        <span className="text-[12px] font-semibold text-[#15803d]">
                                                            In stock · {Number(totalStock || 0).toLocaleString()} {uom}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2 rounded-full border border-[#fecaca] bg-[#fef2f2] px-3 py-1.5">
                                                        <span className="size-2 rounded-full bg-[#dc2626]" />
                                                        <span className="text-[12px] font-semibold text-[#dc2626]">Out of stock</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Add to Cart — full width */}
                                            <div data-tour="product-detail-add-to-cart">
                                                <CardButton item={data} index={0} text_btn={true} is_big={true} full_width={true} />
                                            </div>
                                        </div>

                                        {/* Business signals — inline, only when present */}
                                        {signalChips.length > 0 && (
                                            <div data-tour="product-detail-business-signals" className="mt-5 grid grid-cols-3 divide-x divide-[#eef0f3] rounded-[16px] border border-[#ececf0] bg-[#fbfbfc]">
                                                {signalChips.map((chip) => (
                                                    <div key={chip.label} className="px-3 py-3 text-center">
                                                        <p className="text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">{chip.label}</p>
                                                        <p className="mt-1 text-[13px] font-bold text-[#1e293b]">{chip.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Tabs: Product Details / Stock / QR */}
                                        <div data-tour="product-detail-tabs" className="mt-7">
                                            <Tabs
                                                stockDetails={stockRows}
                                                productDetails={{ ...data, total_stock: totalStock }}
                                                bundles={relatedContext?.bundles?.items}
                                                onOpenProduct={openDetail}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <RelatedIntelligenceSections
                                    itemCode={data.item_code}
                                    relatedContext={relatedContext}
                                    onOpenProduct={openDetail}
                                    loading={relatedLoading}
                                    className="px-5 pb-28 lg:px-9 lg:pb-28"
                                />
                            </>
                        )
                    )}
                </div>

                {/* ── Sticky bottom CTA ── */}
                {!loader && hasPrice && (
                    <div className={`flex-none border-t border-[#ececf0] bg-white/95 backdrop-blur-md px-4 lg:px-9 transition-all duration-300 ${showStickyCta ? 'max-h-[120px] py-3 opacity-100' : 'max-h-0 py-0 opacity-0 overflow-hidden pointer-events-none'}`}>
                        <div className="flex items-center gap-4">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[12px] font-medium text-[#6b7280] capitalize">{data.item_name}</p>
                                <p className="text-[17px] font-extrabold text-[#0b0c0e] tracking-[-0.02em]">
                                    AED {parseFloat(data.offer_rate > 0 ? data.offer_rate : data.rate).toFixed(2)}
                                </p>
                            </div>
                            <div className="shrink-0 w-[170px]">
                                <CardButton item={data} index={0} text_btn={true} is_big={true} full_width={true} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Image zoom overlay ── */}
            {zoomOpen && (
                <div
                    className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 p-6 cursor-zoom-out"
                    onClick={() => setZoomOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setZoomOpen(false)}
                        className="absolute top-5 right-5 size-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 text-[24px] leading-none"
                        aria-label="Close zoom"
                    >
                        ×
                    </button>
                    <Image
                        src={primaryImage}
                        width={1000}
                        height={1000}
                        alt={data.item_name || 'Product'}
                        className="max-h-[90vh] w-auto object-contain"
                        onClick={(e) => e.stopPropagation()}
                        onError={(e) => { e.target.onerror = null; e.target.src = '/empty-states.png'; }}
                    />
                </div>
            )}
        </>
    );
};

export default ProductDetail;


const SheetSkeleton = () => (
    <div className="lg:grid lg:grid-cols-[460px_1fr] animate-pulse">
        <div className="hidden lg:block border-r border-[#e9edf2] p-7">
            <div className="h-[440px] bg-slate-200 rounded-[22px]" />
            <div className="flex gap-2.5 mt-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[64px] h-[64px] bg-slate-200 rounded-[14px]" />
                ))}
            </div>
        </div>
        <div className="p-9 space-y-4">
            <div className="h-4 w-28 bg-slate-200 rounded-full" />
            <div className="h-9 w-3/4 bg-slate-200 rounded" />
            <div className="h-[150px] w-full bg-slate-200 rounded-[20px] mt-6" />
            <div className="h-16 w-full bg-slate-200 rounded-[16px]" />
            <div className="h-px bg-slate-200" />
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-2/3 bg-slate-200 rounded" />
        </div>
    </div>
);
