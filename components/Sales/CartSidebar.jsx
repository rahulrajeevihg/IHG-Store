import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
  update_cartitem,
  delete_cart_items,
  clear_cart,
  search_opportunities,
  create_quotation_from_portal,
  get_recent_quotations,
  get_cart_items,
  check_Image,
  extractFrappeErrorMessage,
  getErpDeskQuotationUrl,
} from '@/libs/api';
import {
  setCartItems,
  resetCart,
  updateItemQty,
  removeItem,
  setSelectedOpportunity,
  clearSelectedOpportunity,
  setItemNote,
} from '@/redux/slice/cartSettings';
import QuotationHistoryDrawer from './QuotationHistoryDrawer';

export default function CartSidebar({ onClose, onQuotationCreated }) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cartSettings.cartItems);
  const cartValue = useSelector((state) => state.cartSettings.cartValue);
  const cartCount = useSelector((state) => state.cartSettings.cartCount);
  const selectedOpp = useSelector((state) => state.cartSettings.selectedOpportunity);
  const itemNotes = useSelector((state) => state.cartSettings.itemNotes);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [recentQuotations, setRecentQuotations] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync search input field when Redux selectedOpp changes (e.g. after page nav)
  useEffect(() => {
    if (selectedOpp) setSearchQuery(selectedOpp.name);
  }, []);  // only on mount

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const syncCart = async () => {
    const res = await get_cart_items();
    if (res?.message) dispatch(setCartItems(res.message));
  };

  const handleOppSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    dispatch(clearSelectedOpportunity());
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim() || val.trim().length < 2) {
      setSearchResults([]);
      setDropdownOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setDropdownOpen(true);
      try {
        const resp = await search_opportunities(val.trim());
        setSearchResults(resp?.message?.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const selectOpp = (opp) => {
    dispatch(setSelectedOpportunity(opp));
    setSearchQuery(opp.name);
    setDropdownOpen(false);
    setSearchResults([]);
  };

  const clearOpp = () => {
    dispatch(clearSelectedOpportunity());
    setSearchQuery('');
    setSearchResults([]);
    setDropdownOpen(false);
  };

  const handleCreateQuotation = async () => {
    if (!selectedOpp) {
      toast.warning('Select an opportunity first');
      return;
    }
    if (!cartItems.length) {
      toast.warning('Cart is empty');
      return;
    }
    const quotationWindow = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    setIsCreating(true);
    try {
      const payload = {
        opportunity: selectedOpp.name,
        items: cartItems.map((item) => ({
          item_code: item.item_code,
          qty: item.quantity || item.count || 1,
          rate: item.rate,
          description: itemNotes[item.item_code] || '',
        })),
      };
      const resp = await create_quotation_from_portal(payload);
      if (resp?.message?.status === 'success') {
        const qname = resp.message.quotation;
        const quotationUrl = getErpDeskQuotationUrl(qname);
        if (quotationWindow && quotationUrl) {
          quotationWindow.location.href = quotationUrl;
        } else if (quotationUrl) {
          window.open(quotationUrl, '_blank', 'noopener,noreferrer');
        }
        toast.success(`Draft quotation ${qname} opened in ERPNext. Complete required fields and save it there.`);
        try { await clear_cart(); } catch (_) {}
        dispatch(resetCart());   // also clears selectedOpportunity and itemNotes
        setSearchQuery('');
        setPreviewOpen(false);
        onQuotationCreated?.(qname);
        // refresh drawer list if open
        if (drawerOpen) loadRecentQuotations();
      } else {
        if (quotationWindow) quotationWindow.close();
        toast.error(extractFrappeErrorMessage(resp, 'Failed to create quotation'));
      }
    } catch (error) {
      if (quotationWindow) quotationWindow.close();
      toast.error(extractFrappeErrorMessage(error, 'Error creating quotation'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Clear all items from cart?')) return;
    try {
      await clear_cart();
      dispatch(resetCart());
      setSearchQuery('');
    } catch {
      toast.error('Failed to clear cart');
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Item Code', 'Item Name', 'Qty', 'Rate (AED)', 'Total (AED)', 'Note'],
      ...cartItems.map((item) => [
        item.item_code,
        `"${(item.item_name || '').replace(/"/g, '""')}"`,
        item.quantity || item.count || 0,
        parseFloat(item.rate || 0).toFixed(2),
        ((item.quantity || item.count || 0) * parseFloat(item.rate || 0)).toFixed(2),
        `"${(itemNotes[item.item_code] || '').replace(/"/g, '""')}"`,
      ]),
      ['', 'TOTAL', '', '', parseFloat(cartValue?.grand_total || 0).toFixed(2), ''],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ihg-cart-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadRecentQuotations = async () => {
    setRecentLoading(true);
    try {
      const resp = await get_recent_quotations();
      setRecentQuotations(resp?.message?.data || []);
    } catch {
      setRecentQuotations([]);
    } finally {
      setRecentLoading(false);
    }
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    if (!recentQuotations.length) loadRecentQuotations();
  };

  const grandTotal = parseFloat(cartValue?.grand_total || 0);
  const subtotal = parseFloat(cartValue?.total || 0);
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('full_name');

  return (
    <>
      <div className="flex flex-col h-full bg-white border border-[#e5e7eb] text-[#111]">
        {/* Header */}
        <div className="flex items-center justify-between px-[14px] py-[12px] border-b border-[#e5e7eb]">
          <span className="text-[13px] font-bold tracking-wide">
            Cart {cartCount > 0 && <span className="text-[#6b7280]">({cartCount})</span>}
          </span>
          <div className="flex items-center gap-[8px]">
            {cartCount > 0 && (
              <>
                <button
                  onClick={exportCSV}
                  title="Export as CSV"
                  className="text-[11px] text-[#6b7280] hover:text-[#111] underline-offset-2 hover:underline"
                >
                  Export
                </button>
                <button
                  onClick={handleClearCart}
                  title="Clear cart"
                  className="text-[11px] text-[#dc2626] hover:text-[#b91c1c] underline-offset-2 hover:underline"
                >
                  Clear
                </button>
              </>
            )}
            {onClose && (
              <button onClick={onClose} className="text-[#9ca3af] hover:text-[#111] ml-[2px]">
                <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-[14px]" style={{ maxHeight: 'calc(100vh - 460px)' }}>
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[40px] text-center">
              <svg className="h-[36px] w-[36px] text-[#e5e7eb] mb-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <p className="text-[12px] text-[#9ca3af]">Cart is empty</p>
              <p className="text-[11px] text-[#c4c9d0] mt-[4px]">Search for products above</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f3f4f6]">
              {cartItems.map((item) => (
                <CartItemRow
                  key={item.cart_id || item.item_code}
                  item={item}
                  note={itemNotes[item.item_code] || ''}
                  onSync={syncCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        {cartItems.length > 0 && (
          <div className="px-[14px] pt-[10px] pb-[6px] border-t border-[#f3f4f6]">
            <div className="flex justify-between text-[11px] text-[#6b7280] mb-[4px]">
              <span>Subtotal</span>
              <span>AED {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[13px] font-bold text-[#111]">
              <span>Est. Total</span>
              <span>AED {grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Opportunity selector + Quotation */}
        <div className="px-[14px] pb-[14px] border-t border-[#e5e7eb] pt-[12px] space-y-[8px]">
          {!isLoggedIn ? (
            <p className="text-[11px] text-[#9ca3af] text-center">Login to create quotations</p>
          ) : (
            <>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6b7280] mb-[4px]">
                Opportunity
              </label>

              <div className="relative" ref={searchRef}>
                <div className={`flex items-center gap-[6px] bg-white border rounded-[4px] px-[8px] transition-all ${dropdownOpen ? 'border-[#111] ring-1 ring-[#111]/10' : 'border-[#d1d5db]'}`}>
                  <svg className="w-[11px] h-[11px] text-[#9ca3af] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleOppSearch}
                    onFocus={() => { if (searchResults.length) setDropdownOpen(true); }}
                    placeholder="Search opportunity..."
                    disabled={!!selectedOpp}
                    className="w-full py-[7px] bg-transparent outline-none text-[11px] text-[#111] placeholder-[#9ca3af] disabled:text-[#6b7280]"
                  />
                  {(searchQuery || selectedOpp) && (
                    <button onClick={clearOpp} className="text-[#9ca3af] hover:text-[#111] shrink-0">
                      <svg className="w-[11px] h-[11px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>

                {dropdownOpen && (
                  <div className="absolute z-50 w-full mt-[2px] bg-white border border-[#e5e7eb] shadow-lg overflow-hidden rounded-[4px]">
                    {isSearching ? (
                      <div className="flex items-center gap-[6px] px-[10px] py-[8px] text-[11px] text-[#9ca3af]">
                        <Spinner /> Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-[10px] py-[8px] text-[11px] text-[#9ca3af]">No results</div>
                    ) : (
                      <ul className="max-h-[180px] overflow-y-auto divide-y divide-[#f3f4f6]">
                        {searchResults.map((opp) => (
                          <li
                            key={opp.name}
                            onClick={() => selectOpp(opp)}
                            className="px-[10px] py-[8px] cursor-pointer hover:bg-[#f9fafb]"
                          >
                            <p className="text-[11px] font-semibold text-[#111]">{opp.name}</p>
                            <p className="text-[10px] text-[#9ca3af] mt-[1px]">
                              {opp.customer_name || opp.customer}
                              {opp.title ? ` — ${opp.title}` : ''}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {selectedOpp && (
                <div className="flex items-center gap-[6px] px-[8px] py-[6px] bg-[#f0fdf4] border border-[#bbf7d0] rounded-[4px]">
                  <svg className="w-[11px] h-[11px] text-[#16a34a] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[#15803d] truncate">{selectedOpp.name}</p>
                    {selectedOpp.customer_name && (
                      <p className="text-[10px] text-[#16a34a] truncate">{selectedOpp.customer_name}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action row */}
              <div className="flex gap-[6px]">
                {cartItems.length > 0 && selectedOpp && (
                  <button
                    onClick={() => setPreviewOpen(true)}
                    className="flex-1 py-[8px] text-[11px] font-bold uppercase tracking-[0.1em] border border-[#111] text-[#111] hover:bg-[#f9fafb] transition-colors"
                  >
                    Preview
                  </button>
                )}
                <button
                  onClick={handleCreateQuotation}
                  disabled={isCreating || !selectedOpp || cartItems.length === 0}
                  className={`flex-1 py-[8px] text-[11px] font-bold uppercase tracking-[0.1em] transition-colors flex items-center justify-center gap-[6px] ${
                    isCreating || !selectedOpp || cartItems.length === 0
                      ? 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                      : 'bg-[#111] text-white hover:bg-[#333]'
                  }`}
                >
                  {isCreating ? <><Spinner /> Creating...</> : 'Create Quotation'}
                </button>
              </div>
            </>
          )}

          {/* View quotation history */}
          <button
            onClick={openDrawer}
            className="w-full text-center text-[10px] text-[#9ca3af] hover:text-[#111] py-[4px] underline-offset-2 hover:underline"
          >
            View Recent Quotations
          </button>
        </div>

        {/* Quotation Preview Modal */}
        {previewOpen && (
          <QuotationPreviewModal
            cartItems={cartItems}
            itemNotes={itemNotes}
            opportunity={selectedOpp}
            grandTotal={grandTotal}
            isCreating={isCreating}
            onConfirm={handleCreateQuotation}
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </div>

      {/* Quotation History Drawer */}
      <QuotationHistoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        quotations={recentQuotations}
        loading={recentLoading}
        onRefresh={loadRecentQuotations}
      />
    </>
  );
}

/* ── Cart Item Row ── */
function CartItemRow({ item, note, onSync }) {
  const dispatch = useDispatch();
  const [localQty, setLocalQty] = useState(item.quantity || item.count || 0);
  const [saving, setSaving] = useState(false);
  const [noteOpen, setNoteOpen] = useState(!!note);
  const [localNote, setLocalNote] = useState(note);
  const commitRef = useRef(null);
  const noteRef = useRef(null);

  useEffect(() => {
    setLocalQty(item.quantity || item.count || 0);
  }, [item.quantity, item.count]);

  useEffect(() => {
    setLocalNote(note);
  }, [note]);

  const commitQty = async (newQty) => {
    setSaving(true);
    try {
      if (newQty <= 0) {
        dispatch(removeItem({ item_code: item.item_code }));
        await delete_cart_items({ cart_id: item.cart_id || item.name, customer_id: typeof window !== 'undefined' ? localStorage.getItem('customerRefId') : '' });
      } else {
        dispatch(updateItemQty({ item_code: item.item_code, qty: newQty }));
        await update_cartitem({ item_code: item.item_code, qty: newQty, qty_type: '', business: item.business || '' });
      }
      await onSync();
    } catch {
      toast.error('Failed to update cart');
      await onSync();
    } finally {
      setSaving(false);
    }
  };

  const handleQtyChange = (newQty) => {
    const qty = Math.max(0, newQty);
    setLocalQty(qty);
    if (commitRef.current) clearTimeout(commitRef.current);
    commitRef.current = setTimeout(() => commitQty(qty), 600);
  };

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setLocalNote(val);
    if (noteRef.current) clearTimeout(noteRef.current);
    noteRef.current = setTimeout(() => {
      dispatch(setItemNote({ item_code: item.item_code, note: val }));
    }, 400);
  };

  const imgSrc = check_Image(item.website_image_url || item.image);
  const lineTotal = localQty * parseFloat(item.rate || 0);

  return (
    <div className="py-[10px]">
      <div className="flex items-start gap-[8px]">
        {/* Thumbnail */}
        <div className="shrink-0 w-[38px] h-[38px] bg-[#f7f7f7] border border-[#e5e7eb] overflow-hidden flex items-center justify-center">
          <img
            src={imgSrc}
            alt={item.item_name || item.item_code}
            className="w-full h-full object-contain p-[2px]"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[9px] text-[#9ca3af] truncate leading-none">{item.item_code}</p>
          <p className="text-[11px] font-medium text-[#111] leading-tight mt-[1px] line-clamp-2">{item.item_name}</p>
          <div className="flex items-center gap-[6px] mt-[2px]">
            <p className="text-[11px] font-bold text-[#111]">AED {lineTotal.toFixed(2)}</p>
            <button
              onClick={() => setNoteOpen((o) => !o)}
              className="text-[9px] text-[#9ca3af] hover:text-[#111] underline-offset-1 hover:underline"
            >
              {noteOpen ? 'hide note' : localNote ? 'edit note' : '+ note'}
            </button>
          </div>
        </div>

        {/* Qty stepper */}
        <div className="flex items-center gap-[2px] shrink-0">
          <button
            onClick={() => handleQtyChange(localQty - 1)}
            className="w-[22px] h-[22px] border border-[#e5e7eb] flex items-center justify-center text-[13px] text-[#374151] hover:border-[#111] transition-colors"
          >
            −
          </button>
          <input
            type="number"
            min="0"
            value={localQty}
            onChange={(e) => handleQtyChange(parseInt(e.target.value) || 0)}
            className="w-[32px] h-[22px] border border-[#e5e7eb] text-center text-[11px] font-bold outline-none text-[#111] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => handleQtyChange(localQty + 1)}
            className="w-[22px] h-[22px] border border-[#111] bg-[#111] flex items-center justify-center text-[13px] text-white hover:bg-[#333] transition-colors"
          >
            +
          </button>
          {saving && <Spinner />}
        </div>
      </div>

      {/* Note field */}
      {noteOpen && (
        <textarea
          value={localNote}
          onChange={handleNoteChange}
          placeholder="Add a note for this item (specs, clarifications)..."
          rows={2}
          className="mt-[6px] w-full resize-none border border-[#e5e7eb] rounded-[3px] px-[8px] py-[5px] text-[10px] text-[#374151] placeholder-[#d1d5db] outline-none focus:border-[#111] transition-colors"
        />
      )}
    </div>
  );
}

/* ── Quotation Preview Modal ── */
function QuotationPreviewModal({ cartItems, itemNotes, opportunity, grandTotal, isCreating, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-[16px]" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-[520px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-[20px] py-[14px] border-b border-[#e5e7eb]">
          <h2 className="text-[14px] font-bold">Quotation Preview</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#111]">
            <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-[20px] py-[12px] border-b border-[#f3f4f6] bg-[#f9fafb]">
          <p className="text-[11px] text-[#6b7280]">Opportunity</p>
          <p className="text-[13px] font-semibold">{opportunity?.name}</p>
          {opportunity?.customer_name && <p className="text-[11px] text-[#6b7280]">{opportunity.customer_name}</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-[20px] py-[12px]">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#e5e7eb]">
                <th className="text-left py-[6px] text-[#6b7280] font-semibold uppercase tracking-[0.08em]">Item</th>
                <th className="text-right py-[6px] text-[#6b7280] font-semibold uppercase tracking-[0.08em]">Qty</th>
                <th className="text-right py-[6px] text-[#6b7280] font-semibold uppercase tracking-[0.08em]">Rate</th>
                <th className="text-right py-[6px] text-[#6b7280] font-semibold uppercase tracking-[0.08em]">Total</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => {
                const qty = item.quantity || item.count || 0;
                const rate = parseFloat(item.rate || 0);
                const note = itemNotes[item.item_code];
                return (
                  <tr key={item.item_code} className="border-b border-[#f3f4f6]">
                    <td className="py-[6px]">
                      <p className="font-mono text-[9px] text-[#9ca3af]">{item.item_code}</p>
                      <p className="font-medium text-[#111] leading-tight">{item.item_name}</p>
                      {note && <p className="text-[9px] text-[#9ca3af] italic mt-[2px]">{note}</p>}
                    </td>
                    <td className="text-right py-[6px] font-bold">{qty}</td>
                    <td className="text-right py-[6px]">AED {rate.toFixed(2)}</td>
                    <td className="text-right py-[6px] font-bold">AED {(qty * rate).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-[20px] py-[12px] border-t border-[#e5e7eb]">
          <div className="flex justify-between text-[13px] font-bold mb-[12px]">
            <span>Grand Total</span>
            <span>AED {grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex gap-[8px]">
            <button onClick={onClose} className="flex-1 py-[10px] text-[11px] font-bold uppercase tracking-[0.1em] border border-[#e5e7eb] text-[#6b7280] hover:border-[#111] hover:text-[#111] transition-colors">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isCreating}
              className="flex-1 py-[10px] text-[11px] font-bold uppercase tracking-[0.1em] bg-[#111] text-white hover:bg-[#333] transition-colors flex items-center justify-center gap-[6px] disabled:bg-[#9ca3af] disabled:cursor-not-allowed"
            >
              {isCreating ? <><Spinner /> Creating...</> : 'Confirm & Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="inline-block h-[10px] w-[10px] animate-spin rounded-full border-[2px] border-[#e5e7eb] border-t-[#111]" />
  );
}
