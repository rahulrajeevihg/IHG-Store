import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import CartSidebar from './CartSidebar';

export default function CartModal({ open, onClose, onQuotationCreated }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !open) return;
    const prev = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof window === 'undefined') return null;

  const node = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999998] flex items-start justify-center bg-black/55 px-[16px] py-[24px] overflow-y-auto"
      style={{ animation: 'cm_bg .18s ease both' }}
    >
      <style>{`
        @keyframes cm_bg { from{opacity:0} to{opacity:1} }
        @keyframes cm_pop { from{opacity:0;transform:translateY(12px) scale(.985)} to{opacity:1;transform:none} }
        .cm_panel { animation:cm_pop .22s cubic-bezier(.25,.8,.25,1) both }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className="cm_panel relative w-full max-w-[520px] bg-white rounded-[12px] shadow-[0_24px_60px_rgba(0,0,0,0.22)] overflow-hidden"
        style={{ minHeight: '60vh', maxHeight: 'calc(100vh - 48px)' }}
      >
        <div className="h-full" style={{ minHeight: '60vh', maxHeight: 'calc(100vh - 48px)' }}>
          <CartSidebar onClose={onClose} onQuotationCreated={onQuotationCreated} />
        </div>
      </div>
    </div>
  );

  return createPortal(node, window.document.body);
}
