import { useEffect } from 'react';
import { getErpDeskQuotationUrl } from '@/libs/api';

export default function QuotationHistoryDrawer({ open, onClose, quotations, loading, onRefresh }) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[200] bg-black/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-[201] h-full w-[420px] max-w-full bg-white shadow-2xl flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[20px] py-[16px] border-b border-[#e5e7eb]">
          <div>
            <h2 className="text-[14px] font-bold text-[#111]">Recent Quotations</h2>
            <p className="text-[11px] text-[#9ca3af] mt-[1px]">Your last 20 quotations</p>
          </div>
          <div className="flex items-center gap-[10px]">
            <button
              onClick={onRefresh}
              title="Refresh"
              className="text-[11px] text-[#6b7280] hover:text-[#111] underline-offset-2 hover:underline"
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              className="text-[#9ca3af] hover:text-[#111]"
              aria-label="Close"
            >
              <svg className="h-[16px] w-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-[10px]">
              <div className="h-[20px] w-[20px] animate-spin rounded-full border-[2px] border-[#e5e7eb] border-t-[#111]" />
              <p className="text-[11px] text-[#9ca3af]">Loading quotations...</p>
            </div>
          ) : quotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-[8px] px-[20px] text-center">
              <svg className="h-[32px] w-[32px] text-[#e5e7eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
              </svg>
              <p className="text-[12px] text-[#9ca3af]">No quotations yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#f3f4f6]">
              {quotations.map((q) => (
                <li key={q.name}>
                  <a
                    href={getErpDeskQuotationUrl(q.name)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start justify-between gap-[10px] px-[20px] py-[14px] hover:bg-[#f9fafb] transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-[8px] mb-[3px]">
                        <span className="font-mono text-[12px] font-bold text-[#111] group-hover:underline underline-offset-2">
                          {q.name}
                        </span>
                        <QuotationStatusBadge status={q.status} />
                      </div>
                      {q.customer_name && (
                        <p className="text-[11px] text-[#6b7280] truncate">{q.customer_name}</p>
                      )}
                      {q.opportunity && (
                        <p className="text-[10px] text-[#9ca3af] truncate mt-[1px]">
                          Opp: {q.opportunity}
                        </p>
                      )}
                      <p className="text-[10px] text-[#9ca3af] mt-[2px]">
                        {q.creation ? new Date(q.creation).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-bold text-[#111]">
                        AED {parseFloat(q.grand_total || 0).toFixed(2)}
                      </p>
                      <svg className="h-[12px] w-[12px] text-[#d1d5db] mt-[6px] ml-auto group-hover:text-[#111] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function QuotationStatusBadge({ status }) {
  const styles = {
    Draft:     'bg-[#fef9c3] text-[#92400e]',
    Submitted: 'bg-[#dcfce7] text-[#15803d]',
    Cancelled: 'bg-[#fee2e2] text-[#b91c1c]',
    Expired:   'bg-[#f3f4f6] text-[#6b7280]',
  };
  return (
    <span className={`inline-block px-[5px] py-[1px] text-[8px] font-bold uppercase tracking-[0.08em] ${styles[status] || styles.Expired}`}>
      {status || 'Draft'}
    </span>
  );
}
