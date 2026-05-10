import { check_Image, get_product_details, typesense_search_items } from '@/libs/api';
import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import ProductBox from '../Product/ProductBox';
import CardButton from '../Product/CardButton';
import Tabs from '../Common/Tabs';

const ProductDetail = ({ hide, visible, productData }) => {
    const [relatedProductData, setRelatedData] = useState([]);
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

            if (detail && detail.stock && detail.stock.length > 0) {
                setDetails(detail);
            } else {
                setDetails([]);
            }

            if (detail.related_products) {
                let relatedSections = {};
                const keysToFetch = ["Bought Together", "category_list", "Must Use", "Add On"];
                let excludedItemCodes = new Set();

                ["Bought Together", "Must Use", "Add On"].forEach((key) => {
                    if (detail.related_products[key]) {
                        detail.related_products[key].forEach((code) => excludedItemCodes.add(code));
                    }
                });

                keysToFetch.forEach((key) => {
                    let values = detail.related_products[key] || [];
                    if (key === "category_list") {
                        values = values.filter((code) => !excludedItemCodes.has(code));
                    }
                    const filterQuery = values.map((code) => `item_code:="${code}"`).join(" || ");
                    relatedSections[key] = { query: filterQuery, data: [] };
                });

                for (const key in relatedSections) {
                    if (!relatedSections[key].query) continue;
                    const queryParams = new URLSearchParams({
                        q: "*",
                        query_by: "item_name,item_description,brand",
                        query_by_weights: "1,2,3",
                        filter_by: relatedSections[key].query
                    });
                    const res = await typesense_search_items(queryParams);
                    relatedSections[key].data = res.hits || [];
                }
                setRelatedData({ ...relatedSections });
            } else {
                setRelatedData({});
            }
        } catch (e) {
            console.error('getDetail error', e);
        }
    };

    const openDetail = (value) => {
        if (value && value.document) {
            const doc = value.document;
            setData({ ...doc });
            setActiveThumb(0);
            setLoader(false);
            fetchFullProduct(doc.item_code);
            getDetail(doc.item_code);
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
                        onClick={() => hide(undefined)}
                        className="size-[34px] flex items-center justify-center rounded-full text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#111] transition-colors text-[22px] leading-none"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div ref={bodyRef} className="flex-1 overflow-y-auto">
                    {loader ? (
                        <SheetSkeleton />
                    ) : (
                        data && Object.keys(data).length > 0 && (
                            <>
                                {/* Top section: image | info */}
                                <div className="lg:grid lg:grid-cols-[400px_1fr]">

                                    {/* LEFT — image panel, sticky */}
                                    <div className="hidden lg:block border-r border-[#e9edf2]">
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
                                    <div className="p-5 lg:p-7">
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

                                        <div className="h-px bg-[#f0f2f5] mb-4" />

                                        {/* Price */}
                                        <div className="mb-4">
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
                                        <div className="mb-5">
                                            {data.stock > 0 ? (
                                                <div className="inline-flex items-center gap-2">
                                                    <span className="size-2 rounded-full bg-[#16a34a] shadow-[0_0_0_3px_rgba(22,163,74,0.18)]" />
                                                    <span className="text-[13px] font-semibold text-[#16a34a]">
                                                        IN STOCK · {Number(data.stock).toLocaleString()} Nos
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2">
                                                    <span className="size-2 rounded-full bg-[#dc2626]" />
                                                    <span className="text-[13px] font-semibold text-[#dc2626]">OUT OF STOCK</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Add to Cart */}
                                        <div className="mb-6">
                                            <CardButton item={data} index={0} text_btn={true} is_big={true} />
                                        </div>

                                        <div className="h-px bg-[#f0f2f5] mb-4" />

                                        {/* Tabs: Product Details / Stock / QR */}
                                        <Tabs stockDetails={details.stock} productDetails={data} />
                                    </div>
                                </div>

                                {/* ── Related products (below fold, full width) ── */}
                                {relatedProductData && Object.keys(relatedProductData).length > 0 && (() => {
                                    const hasBoughtTogether = relatedProductData["Bought Together"]?.data?.length > 0;

                                    const filteredData = Object.entries(relatedProductData).filter(([key, value]) => {
                                        if (!value.data.length) return false;
                                        if (key === "Add On" || key === "Must Use") return true;
                                        if (key === "Bought Together") return true;
                                        if (key === "category_list" && !hasBoughtTogether) return true;
                                        return false;
                                    });

                                    if (filteredData.length === 0) return null;

                                    return (
                                        <div className="border-t border-[#e9edf2]">
                                            {filteredData.map(([key, value]) => (
                                                <div key={key} className="px-5 lg:px-7 py-5 border-b border-[#f0f2f5] last:border-b-0">
                                                    <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#111] mb-3">
                                                        {key === "Bought Together" || key === "category_list"
                                                            ? "Related Products"
                                                            : key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                                    </h3>
                                                    <ProductBox
                                                        openDetail={openDetail}
                                                        productList={value.data}
                                                        scroll_button={true}
                                                        rowStyle={true}
                                                        scroll_id={`related_${key}`}
                                                        rowCount={"flex-[0_0_calc(20%_-_8px)] min-w-[160px]"}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </>
                        )
                    )}
                </div>
            </div>
        </>
    );
};

export default ProductDetail;


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
