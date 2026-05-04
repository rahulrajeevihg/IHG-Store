export default function AiStatusBanner({ aiSession, onClear }) {
  if (!aiSession || aiSession.mode !== 'ai') return null;

  const isDeterministicOnly = aiSession.quality_signals?.deterministic_only === true;
  const relaxations = Array.isArray(aiSession.applied_relaxations) ? aiSession.applied_relaxations : [];
  const hasRelaxations = relaxations.length > 0;
  const resultQuality = String(aiSession.quality_signals?.result_quality || '').toLowerCase();
  const isWeak = ['weak', 'poor', 'low'].includes(resultQuality) && !hasRelaxations;

  if (!isDeterministicOnly && !hasRelaxations && !isWeak) return null;

  return (
    <div className="mb-[10px] space-y-[5px]">
      {isDeterministicOnly && (
        <div className="flex items-center gap-[8px] border border-[#d97706]/40 bg-[#fffbeb] px-[12px] py-[8px] text-[11px] text-[#92400e]">
          <InfoIcon />
          <span>
            Resolved using pattern matching — AI model was not used.{' '}
            <button onClick={onClear} className="underline font-semibold hover:text-[#78350f]">
              Try a different search
            </button>
          </span>
        </div>
      )}

      {hasRelaxations && (
        <div className="flex items-start gap-[8px] border border-[#e5e5e5] bg-[#fafafa] px-[12px] py-[8px] text-[11px] text-[#6b7280]">
          <InfoIcon className="mt-[1px] shrink-0 text-[#f59e0b]" />
          <div>
            <span className="font-semibold text-[#111]">Some filters were relaxed to find results:</span>
            <ul className="mt-[4px] list-disc list-inside space-y-[2px]">
              {relaxations.map((r, i) => (
                <li key={i}>{typeof r === 'string' ? r : JSON.stringify(r)}</li>
              ))}
            </ul>
            {onClear && (
              <button onClick={onClear} className="mt-[6px] underline text-[#111] font-medium hover:text-[#444]">
                Clear AI search
              </button>
            )}
          </div>
        </div>
      )}

      {isWeak && (
        <div className="flex items-center gap-[8px] border border-[#e5e5e5] bg-[#fafafa] px-[12px] py-[8px] text-[11px] text-[#6b7280]">
          <InfoIcon />
          <span>
            AI confidence is low for this search. Try rephrasing or use the filters.
          </span>
        </div>
      )}
    </div>
  );
}

function InfoIcon({ className = 'text-[#9ca3af]' }) {
  return (
    <svg className={`h-[13px] w-[13px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
    </svg>
  );
}
