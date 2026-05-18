import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";

const SPEC_FIELDS = [
  { label: "Product Type",    key: "product_type" },
  { label: "Stock UOM",       key: "stock_uom" },
  { label: "Power",           key: "power" },
  { label: "Lumen Output",    key: "lumen_output" },
  { label: "Color Temp",      key: "color_temp_" },
  { label: "Beam Angle",      key: "beam_angle" },
  { label: "IP Rating",       key: "ip_rate" },
  { label: "Mounting",        key: "mounting" },
  { label: "Lamp Type",       key: "lamp_type" },
  { label: "Body Finish",     key: "body_finish" },
  { label: "Material",        key: "material" },
  { label: "Dimension",       key: "dimension" },
  { label: "Input",           key: "input" },
  { label: "Output Voltage",  key: "output_voltage" },
  { label: "Output Current",  key: "output_current" },
  { label: "Warranty",        key: "warranty_" },
];

const TABS = [
  { id: 0, label: "Product Details" },
  { id: 1, label: "Stock Details"   },
  { id: 2, label: "QR Code"         },
];

export default function Tabs({ stockDetails, productDetails }) {
  const [activeTab, setActiveTab]   = useState(0);
  const [expanded, setExpanded]     = useState(false);
  const [overflows, setOverflows]   = useState(false);
  const descRef                     = useRef(null);

  const filteredStock = Array.isArray(stockDetails)
    ? stockDetails.filter((item) => Number(item?.actual_qty) > 0)
    : [];

  const specs = SPEC_FIELDS.filter(
    (f) => productDetails?.[f.key] && String(productDetails[f.key]).trim() !== ""
  );

  // Detect if description actually overflows the clamped height
  useEffect(() => {
    setExpanded(false);
    const el = descRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      setOverflows(el.scrollHeight > el.clientHeight + 2);
    });
    return () => cancelAnimationFrame(id);
  }, [productDetails?.full_description, activeTab]);

  return (
    <div className="w-full mt-2">
      {/* ── Tab bar ── */}
      <div className="flex border-b border-[#e9edf2] overflow-x-auto scrollbarHide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-none px-4 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap
              ${activeTab === tab.id
                ? "text-[#111] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#111] after:content-['']"
                : "text-[#9ca3af] hover:text-[#4b5563]"
              }`}
          >
            {tab.label}
            {tab.id === 1 && filteredStock.length > 0 && (
              <span className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-px text-[10px] font-bold ${activeTab === 1 ? "bg-[#111] text-white" : "bg-[#f3f4f6] text-[#6b7280]"}`}>
                {filteredStock.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="mt-4">

        {/* ──── PRODUCT DETAILS ──── */}
        {activeTab === 0 && (
          <div className="space-y-5">

            {/* Description with expand */}
            {productDetails?.full_description ? (
              <div>
                <div
                  ref={descRef}
                  className={`item-desc text-[13px] text-[#374151] leading-[1.75] overflow-hidden transition-all duration-300 ${expanded ? "max-h-none" : "max-h-[150px]"}`}
                  style={!expanded ? { WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)", maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)" } : {}}
                  dangerouslySetInnerHTML={{ __html: productDetails.full_description }}
                />
                {(overflows || expanded) && (
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-[#111] hover:text-[#4b5563] transition-colors"
                  >
                    {expanded ? "Show less" : "Show more"}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[13px] text-[#9ca3af] italic">No description available.</p>
            )}

            {/* Spec grid */}
            {specs.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Specifications</p>
                <div className="grid grid-cols-2 gap-px bg-[#e9edf2] rounded-md overflow-hidden border border-[#e9edf2]">
                  {specs.map(({ label, key }) => (
                    <div key={key} className="flex flex-col gap-0.5 bg-white px-3 py-2.5">
                      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#9ca3af]">{label}</span>
                      <span className="text-[13px] font-semibold text-[#111] leading-snug">{productDetails[key]}</span>
                    </div>
                  ))}
                  {/* Pad odd row so border grid looks even */}
                  {specs.length % 2 !== 0 && (
                    <div className="bg-white" />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──── STOCK DETAILS ──── */}
        {activeTab === 1 && (
          <div>
            {filteredStock.length > 0 ? (
              <div className="rounded-md border border-[#e9edf2] overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-[#f7f8fa] border-b border-[#e9edf2]">
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6b7280] w-[32px]">#</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6b7280]">Warehouse</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6b7280]">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f2f5]">
                    {filteredStock.map((row, i) => {
                      const qty = Number(row.actual_qty);
                      const isLow = qty > 0 && qty <= 10;
                      return (
                        <tr key={row.warehouse || i} className="hover:bg-[#fafafa] transition-colors">
                          <td className="px-3 py-2.5 text-[#9ca3af]">{i + 1}</td>
                          <td className="px-3 py-2.5 text-[#374151]">{row.warehouse}</td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`inline-flex items-center gap-1 font-semibold ${isLow ? "text-[#d97706]" : "text-[#111]"}`}>
                              {qty}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#e9edf2] bg-[#f7f8fa]">
                      <td className="px-3 py-2.5" />
                      <td className="px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]">Total</td>
                      <td className="px-3 py-2.5 text-right text-[15px] font-bold text-[#111]">
                        {Number(productDetails?.stock || 0).toLocaleString()}
                        <span className="ml-1 text-[11px] font-medium text-[#9ca3af]">Nos</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="size-12 rounded-full bg-[#f3f4f6] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#d1d5db]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                    <path d="M16 3H8L4 7h16l-4-4z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#374151]">No stock available</p>
                  <p className="text-[12px] text-[#9ca3af] mt-0.5">This item is currently out of stock across all warehouses.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──── QR CODE ──── */}
        {activeTab === 2 && (
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            {productDetails?.barcode ? (
              <>
                <div className="rounded-xl border border-[#e9edf2] bg-white p-4 shadow-sm">
                  <Image
                    src={`https://quickchart.io/qr?text=${encodeURIComponent(productDetails.barcode)}&size=220&margin=2`}
                    width={220}
                    height={220}
                    alt="Product QR Code"
                    className="rounded"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-[#9ca3af] uppercase tracking-[0.1em] mb-1">Barcode</p>
                  <p className="font-mono text-[13px] font-semibold text-[#111] select-all">{productDetails.barcode.split(",")[0]}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="size-12 rounded-full bg-[#f3f4f6] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#d1d5db]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <path d="M14 14h3v3M17 20h3M20 17v3" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#374151]">QR not available</p>
                  <p className="text-[12px] text-[#9ca3af] mt-0.5">No barcode is linked to this product.</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
