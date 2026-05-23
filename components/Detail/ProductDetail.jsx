import { check_Image, get_product_details, get_product_related_context, typesense_search_items } from '@/libs/api';
import Head from 'next/head';
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
    const [details, setDetails] = useState({});
    const [loader, setLoader] = useState(true);
    const [data, setData] = useState({});
    const [activeThumb, setActiveThumb] = useState(0);
    const [open, setOpen] = useState(false);
    const bodyRef = useRef(null);

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
            return;
        }
        try {
            const context = await get_product_related_context(itemCode, 8);
            setRelatedContext(context || null);
        } catch (err) {
            console.error('fetchRelatedContext error', err);
            setRelatedContext(null);
        }
    };

    const openDetail = (value) => {
        const doc = value?.document || value;
        if (doc && doc.item_code) {
            setData({ ...doc });
            setActiveThumb(0);
            setLoader(false);
            fetchFullProduct(doc.item_code);
            getDetail(doc.item_code);
            fetchRelatedContext(doc.item_code);
            if (bodyRef.current) bodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') hide(undefined); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    if (!visible) return null;

    const primaryImage = data.images && data.images.length > 0
        ? check_Image(data.images[activeThumb]?.detail_image || data.images[activeThumb]?.image)
        : check_Image(data.website_image_url);

    const discountPct = data.offer_rate > 0 && data.rate > 0
        ? parseInt(((data.rate - data.offer_rate) / data.rate) * 100)
        : 0;
    const businessSignals = getBusinessSignals(data);
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

    return (
        <>
            <Head>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/lightgallery/1.6.12/css/lightgallery.min.css" />
            </Head>

            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-[200] bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
                onClick={() => hide(undefined)}
            />

            {/* Sheet panel — slides in from right */}
            <div
                data-tour="product-detail-panel"
                className={`fixed right-0 top-0 h-screen z-[201] bg-white flex flex-col transition-transform duration-300 ease-out w-full lg:w-[88vw] max-w-[1300px] shadow-[-6px_0_48px_rgba(0,0,0,0.13)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* ── Sticky header ── */}
                <div className="flex-none flex items-center justify-between px-4 lg:px-6 h-[52px] border-b border-[#e9edf2] bg-white shrink-0">
                    <button
                        onClick={() => hide(undefined)}
                        className="flex items-center gap-2 text-[13px] font-medium text-[#6b7280] hover:text-[#111] transition-colors"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="hidden sm:inline">Back to results</span>
                    </button>

                    {data.item_code && (
                        <span className="font-mono text-[11px] tracking-[0.06em] text-[#b0b7c3] hidden md:block select-all">
                            {data.item_code}
                        </span>
                    )}

                    <button
                        data-tour="product-detail-close"
                        onClick={() => hide(undefined)}
                        className="size-[34px] flex items-center justify-center rounded-full text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#111] transition-colors text-[22px] leading-none"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div ref={bodyRef} className="flex-1 overflow-y-auto overflow-x-hidden">
                    {loader ? (
                        <SheetSkeleton />
                    ) : (
                        data && Object.keys(data).length > 0 && (
                            <>
                                {/* Top section: image | info */}
                                <div className="overflow-x-hidden lg:grid lg:grid-cols-[400px_1fr]">

                                    {/* LEFT — image panel, sticky */}
                                    <div data-tour="product-detail-images" className="hidden lg:block border-r border-[#e9edf2]">
                                        <div className="sticky top-0 p-5 bg-white">
                                            {/* Discount badge */}
                                            {discountPct > 0 && (
                                                <div className="absolute top-5 left-5 z-10 bg-[#16a34a] text-white text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-1.5">
                                                    SAVE {discountPct}%
                                                </div>
                                            )}

                                            {/* Main image */}
                                            <div className="h-[380px] bg-[#f7f8fa] flex items-center justify-center overflow-hidden">
                                                <Image
                                                    src={primaryImage || '/empty-states.png'}
                                                    width={380}
                                                    height={380}
                                                    alt={data.item_name || 'Product'}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = '/empty-states.png'; }}
                                                />
                                            </div>

                                            {/* Thumbnail strip */}
                                            {data.images && data.images.length > 1 && (
                                                <div className="flex gap-2 mt-3 overflow-x-auto scrollbarHide pb-1">
                                                    {data.images.slice(0, 6).map((img, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setActiveThumb(idx)}
                                                            className={`flex-none w-[58px] h-[58px] border-2 transition-all duration-150 overflow-hidden bg-[#f7f8fa] ${activeThumb === idx ? 'border-[#111]' : 'border-[#e5e7eb] hover:border-[#9ca3af]'}`}
                                                        >
                                                            <Image
                                                                src={check_Image(img.detail_image || img.image) || '/empty-states.png'}
                                                                width={58}
                                                                height={58}
                                                                alt={`View ${idx + 1}`}
                                                                className="w-full h-full object-contain"
                                                                onError={(e) => { e.target.onerror = null; e.target.src = '/empty-states.png'; }}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* RIGHT — info panel */}
                                    <div className="min-w-0 p-5 lg:p-7">
                                        {/* Mobile image */}
                                        <div className="lg:hidden mb-5 h-[220px] bg-[#f7f8fa] flex items-center justify-center relative overflow-hidden">
                                            {discountPct > 0 && (
                                                <div className="absolute top-2 left-2 z-10 bg-[#16a34a] text-white text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1">
                                                    -{discountPct}%
                                                </div>
                                            )}
                                            <Image
                                                src={primaryImage || '/empty-states.png'}
                                                width={220}
                                                height={220}
                                                alt={data.item_name || 'Product'}
                                                className="h-full w-full object-contain"
                                                onError={(e) => { e.target.onerror = null; e.target.src = '/empty-states.png'; }}
                                            />
                                        </div>

                                        <div data-tour="product-detail-info">
                                        {/* Brand · Category */}
                                        {(data.brand || data.item_group) && (
                                            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b7280] mb-2.5">
                                                {data.brand && <span>{data.brand}</span>}
                                                {data.brand && data.item_group && <span className="text-[#d1d5db]">·</span>}
                                                {data.item_group && <span>{data.item_group}</span>}
                                            </div>
                                        )}

                                        {/* SKU */}
                                        <p className="font-mono text-[11px] text-[#b0b7c3] mb-1.5 tracking-[0.04em]">{data.item_code}</p>

                                        {/* Product name */}
                                        <h2 className="text-[19px] lg:text-[21px] font-semibold text-[#111] leading-snug capitalize mb-3">
                                            {data.item_name}
                                        </h2>

                                        {/* Short description */}
                                        {data.item_description && (
                                            <div
                                                className="text-[13px] text-[#6b7280] leading-relaxed mb-4 line-clamp-3"
                                                dangerouslySetInnerHTML={{ __html: data.item_description }}
                                            />
                                        )}

                                        </div>

                                        <div className="h-px bg-[#f0f2f5] mb-4" />

                                        {/* Price */}
                                        <div data-tour="product-detail-price" className="mb-4">
                                            {data.offer_rate > 0 ? (
                                                <div className="flex flex-wrap items-baseline gap-3">
                                                    <span className="text-[26px] font-bold text-[#111] tracking-tight">
                                                        AED {parseFloat(data.offer_rate).toFixed(2)}
                                                    </span>
                                                    <span className="text-[16px] text-[#9ca3af] line-through">
                                                        {parseFloat(data.rate).toFixed(2)}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-white bg-[#16a34a] px-2.5 py-1 tracking-[0.08em]">
                                                        SAVE {discountPct}%
                                                    </span>
                                                </div>
                                            ) : data.rate > 0 ? (
                                                <span className="text-[26px] font-bold text-[#111] tracking-tight">
                                                    AED {parseFloat(data.rate).toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-[14px] text-[#9ca3af] italic">Price on request</span>
                                            )}
                                        </div>

                                        {/* Stock status */}
                                        <div data-tour="product-detail-stock-detail" className="mb-5">
                                            {isInStock ? (
                                                <div className="inline-flex items-center gap-2">
                                                    <span className="size-2 rounded-full bg-[#16a34a] shadow-[0_0_0_3px_rgba(22,163,74,0.18)]" />
                                                    <span className="text-[13px] font-semibold text-[#16a34a]">
                                                        IN STOCK · {Number(totalStock || 0).toLocaleString()} Nos
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2">
                                                    <span className="size-2 rounded-full bg-[#dc2626]" />
                                                    <span className="text-[13px] font-semibold text-[#dc2626]">OUT OF STOCK</span>
                                                </div>
                                            )}
                                        </div>

                                        <div data-tour="product-detail-business-signals" className="mb-5 rounded-[14px] border border-[#e5e7eb] bg-[#f8fafc] p-3.5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748b] mb-2">
                                                Business Signals
                                            </p>
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                <MetricChip
                                                    label="Star Rating"
                                                    value={businessSignals.hasStarRating ? formatStarRating(businessSignals.starRating) : '-'}
                                                />
                                                <MetricChip
                                                    label="Happy Customers"
                                                    value={businessSignals.hasCustomerCount ? formatHappyCustomers(businessSignals.customerCount) : '-'}
                                                />
                                                <MetricChip
                                                    label="Qty Sold"
                                                    value={businessSignals.hasSoldQty ? formatLifetimeSoldQty(businessSignals.soldQty) : '-'}
                                                />
                                            </div>
                                        </div>

                                        {/* Add to Cart */}
                                        <div data-tour="product-detail-add-to-cart" className="mb-6">
                                            <CardButton item={data} index={0} text_btn={true} is_big={true} />
                                        </div>

                                        <div className="h-px bg-[#f0f2f5] mb-4" />

                                        {/* Tabs: Product Details / Stock / QR */}
                                        <div data-tour="product-detail-tabs">
                                          <Tabs
                                              stockDetails={stockRows}
                                              productDetails={{ ...data, total_stock: totalStock }}
                                          />
                                        </div>
                                    </div>
                                </div>
                                <RelatedIntelligenceSections
                                    itemCode={data.item_code}
                                    relatedContext={relatedContext}
                                    onOpenProduct={openDetail}
                                    className="px-5 pb-6 lg:px-7"
                                />

                            </>
                        )
                    )}
                </div>
            </div>
        </>
    );
};

export default ProductDetail;

const MetricChip = ({ label, value }) => (
    <div className="rounded-[10px] border border-[#e2e8f0] bg-white px-2.5 py-2">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">{label}</p>
        <p className="mt-1 text-[12px] font-semibold text-[#1e293b]">{value}</p>
    </div>
);


const SheetSkeleton = () => (
    <div className="lg:grid lg:grid-cols-[400px_1fr] animate-pulse">
        <div className="hidden lg:block border-r border-[#e9edf2] p-5">
            <div className="h-[380px] bg-slate-200 rounded" />
            <div className="flex gap-2 mt-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[58px] h-[58px] bg-slate-200 rounded" />
                ))}
            </div>
        </div>
        <div className="p-7 space-y-4">
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-2.5 w-36 bg-slate-200 rounded" />
            <div className="h-7 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-2/3 bg-slate-200 rounded" />
            <div className="h-px bg-slate-200" />
            <div className="h-8 w-44 bg-slate-200 rounded" />
            <div className="h-5 w-36 bg-slate-200 rounded" />
            <div className="h-11 w-full bg-slate-200 rounded" />
            <div className="h-px bg-slate-200" />
            <div className="flex gap-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-9 w-28 bg-slate-200 rounded" />)}
            </div>
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-2/3 bg-slate-200 rounded" />
        </div>
    </div>
);
