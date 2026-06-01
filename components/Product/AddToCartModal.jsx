import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { check_Image } from '@/libs/api';
import Dirham from '@/components/Common/Dirham';

export default function AddToCartModal({ item, onClose, onAdd }) {
  const defaultQty = item?.minimum_order_qty > 0 ? Number(item.minimum_order_qty) : 1;
  const [qty, setQty] = useState(defaultQty);
  const inputRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => { document.body.style.overflow = ''; };
  }, []);

  const clamp = (val) => {
    const n = parseInt(val, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  };

  const handleInput = (e) => {
    const raw = e.target.value;
    if (raw === '') { setQty(''); return; }
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 0) setQty(n);
  };

  const handleBlur = () => setQty(clamp(qty));

  const handleAdd = () => {
    onAdd(item, clamp(qty));
    onClose();
  };

  const price = item?.offer_rate > 0 ? item.offer_rate : item?.rate;
  const hasDiscount = item?.offer_rate > 0 && item.offer_rate < item?.rate;
  const inStock = item?.stock > 0;
  const imageUrl = check_Image(item?.website_image_url);
  const discountPct = hasDiscount ? Math.round(((item.rate - item.offer_rate) / item.rate) * 100) : 0;

  const modal = (
    <>
      <style>{`
        @keyframes _atc_bg  { from{opacity:0} to{opacity:1} }
        @keyframes _atc_up  { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }
        ._atc_bg   { animation:_atc_bg  .2s ease both }
        ._atc_card { animation:_atc_up .25s cubic-bezier(.25,.8,.25,1) both }
        ._atc_qty::-webkit-inner-spin-button,
        ._atc_qty::-webkit-outer-spin-button { -webkit-appearance:none }
        ._atc_qty { -moz-appearance:textfield }
        ._atc_qbtn:hover { background:#ebebeb !important }
        ._atc_add:not(:disabled):active { transform:scale(.98) }
        @media(max-width:560px){
          ._atc_card { flex-direction:column !important }
          ._atc_img  { width:100% !important; height:190px !important }
          ._atc_body { padding:20px 18px 24px !important }
        }
      `}</style>

      {/* Full-screen overlay — rendered in document.body via portal */}
      <div
        className="_atc_bg"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 999999,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        {/* Card */}
        <div
          className="_atc_card"
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            width: '100%', maxWidth: 700,
            display: 'flex',
            overflow: 'hidden',
            maxHeight: '90vh',
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute', top: 12, right: 12, zIndex: 10,
              width: 32, height: 32, borderRadius: '50%',
              background: '#f2f2f2', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#555', fontSize: 15,
            }}
          >✕</button>

          {/* Image panel */}
          <div
            className="_atc_img"
            style={{
              width: 240, flexShrink: 0,
              background: '#f7f7f7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '28px 20px',
            }}
          >
            <img
              src={imageUrl}
              alt={item?.item_name || item?.item_code}
              style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
              onError={e => { e.target.src = '/empty-states.png'; }}
            />
          </div>

          {/* Details */}
          <div
            className="_atc_body"
            style={{
              flex: 1, padding: '28px 24px 28px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              overflowY: 'auto',
            }}
          >
            {/* Item code */}
            <p style={{
              fontSize: 11, color: '#999', letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 5,
              fontFamily: 'monospace',
            }}>
              {item?.item_code}
            </p>

            {/* Name */}
            <h2 style={{
              fontSize: 17, fontWeight: 700, color: '#1a1a1a',
              lineHeight: 1.35, marginBottom: 16, paddingRight: 28,
            }}>
              {item?.item_name}
            </h2>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <span className="primary_color" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                {price ? <><Dirham /> {parseFloat(price).toFixed(2)}</> : '—'}
              </span>
              {hasDiscount && (
                <>
                  <span style={{ fontSize: 14, color: '#bbb', textDecoration: 'line-through' }}>
                    AED {parseFloat(item.rate).toFixed(2)}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#16a34a',
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    padding: '2px 7px', borderRadius: 20,
                  }}>-{discountPct}%</span>
                </>
              )}
            </div>

            {/* Stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: inStock ? '#22c55e' : '#ef4444',
              }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: inStock ? '#16a34a' : '#dc2626' }}>
                {inStock ? `${item.stock} ${item.stock_uom || 'units'} in stock` : 'Out of stock'}
              </span>
            </div>

            <div style={{ height: 1, background: '#f0f0f0', marginBottom: 18 }} />

            {/* Qty label */}
            <p style={{ fontSize: 11, color: '#888', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Quantity
            </p>

            {/* Qty stepper */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', marginBottom: 20,
              border: '1.5px solid #e5e5e5', borderRadius: 10, overflow: 'hidden',
            }}>
              <button
                type="button"
                className="_atc_qbtn"
                onClick={() => setQty(q => Math.max(1, clamp(q) - 1))}
                style={{
                  width: 42, height: 42, background: '#fafafa', border: 'none',
                  fontSize: 20, color: '#555', cursor: 'pointer',
                  transition: 'background .12s', userSelect: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >−</button>
              <input
                ref={inputRef}
                type="number"
                min="1"
                value={qty}
                onChange={handleInput}
                onBlur={handleBlur}
                className="_atc_qty"
                style={{
                  width: 54, height: 42, textAlign: 'center',
                  border: 'none',
                  borderLeft: '1.5px solid #e5e5e5',
                  borderRight: '1.5px solid #e5e5e5',
                  fontSize: 15, fontWeight: 700, color: '#1a1a1a',
                  outline: 'none', background: '#fff',
                }}
              />
              <button
                type="button"
                className="_atc_qbtn"
                onClick={() => setQty(q => clamp(q) + 1)}
                style={{
                  width: 42, height: 42, background: '#fafafa', border: 'none',
                  fontSize: 20, color: '#555', cursor: 'pointer',
                  transition: 'background .12s', userSelect: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >+</button>
            </div>

            {/* Add to Cart */}
            <button
              type="button"
              className={`_atc_add${inStock ? ' primary_bg' : ''}`}
              onClick={handleAdd}
              disabled={!inStock}
              style={{
                width: '100%', height: 48, borderRadius: 10, border: 'none',
                cursor: inStock ? 'pointer' : 'not-allowed',
                background: inStock ? undefined : '#e5e5e5',
                color: inStock ? '#fff' : '#aaa',
                fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity .15s, transform .1s',
              }}
              onMouseEnter={e => { if (inStock) e.currentTarget.style.opacity = '.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
