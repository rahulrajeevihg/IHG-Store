// Dependency-free SVG charts tuned for the sales dashboard.
// All values are also exposed as text so the charts stay readable without colour alone.

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const CATEGORY_COLORS = ["#2f56e6", "#10b981", "#f59e0b", "#7c3aed", "#ef4444", "#06b6d4"];

/* Radial gauge for the monthly target (single KPI vs target). */
export function DonutGauge({ value = 0, label = "Achieved", size = 132, stroke = 12 }) {
  const pct = Math.max(0, Math.min(100, toNumber(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={center} cy={center} r={r} fill="none" stroke="#e1e8fb" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.2,0.9,0.3,1)" }}
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f6dff" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[24px] font-[800] leading-none text-[#1b2c54]">{Math.round(pct)}%</span>
        <span className="mt-[2px] text-[10px] font-medium text-[#6c7ca6]">{label}</span>
      </div>
    </div>
  );
}

/* Multi-segment donut for category share, with a centred total. */
export function CategoryDonut({ data = [], total, size = 132, stroke = 16, formatTotal }) {
  const rows = data.filter((d) => toNumber(d.value) > 0).slice(0, 6);
  const sum = rows.reduce((acc, d) => acc + toNumber(d.value), 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;
  let acc = 0;

  return (
    <div className="flex items-center gap-[14px]">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
          <circle cx={center} cy={center} r={r} fill="none" stroke="#eef2fb" strokeWidth={stroke} />
          {rows.map((d, i) => {
            const frac = toNumber(d.value) / sum;
            const dash = frac * c;
            const seg = (
              <circle
                key={d.label}
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-acc * c}
                style={{ transition: "stroke-dasharray 700ms ease" }}
              />
            );
            acc += frac;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] uppercase tracking-[0.1em] text-[#8190b7]">Total</span>
          <span className="text-[13px] font-[800] text-[#1b2c54]">
            {formatTotal ? formatTotal(total != null ? total : sum) : Math.round(total != null ? total : sum)}
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-[6px]">
        {rows.map((d, i) => (
          <li key={d.label} className="flex items-center gap-[7px] text-[11px]">
            <span className="size-[9px] shrink-0 rounded-[3px]" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
            <span className="truncate" style={{ color: "#46568a" }}>{d.label}</span>
            <span className="ml-auto shrink-0 font-semibold text-[#1f3160]">
              {Math.round((toNumber(d.value) / sum) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Vertical bar chart with the latest bar emphasised. */
export function BarChart({ data = [], height = 150, valueFormatter }) {
  const rows = data.slice(-6);
  const max = Math.max(...rows.map((d) => toNumber(d.sales)), 1);

  return (
    <div>
      <div className="flex items-end gap-[8px]" style={{ height }}>
        {rows.map((d, i) => {
          const h = Math.max(6, (toNumber(d.sales) / max) * (height - 26));
          const isLast = i === rows.length - 1;
          return (
            <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-[6px]">
              <span className="text-[9px] font-semibold text-[#5a6c97]">
                {valueFormatter ? valueFormatter(d.sales) : Math.round(toNumber(d.sales))}
              </span>
              <div
                className="w-full rounded-t-[6px]"
                style={{
                  height: h,
                  background: isLast
                    ? "linear-gradient(180deg,#4f6dff,#2f56e6)"
                    : "linear-gradient(180deg,#c6d2fb,#aebcf6)",
                  transition: "height 700ms cubic-bezier(0.2,0.9,0.3,1)",
                }}
                title={`${d.label}: ${valueFormatter ? valueFormatter(d.sales) : d.sales}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-[7px] flex gap-[8px]">
        {rows.map((d) => (
          <span key={d.label} className="flex-1 truncate text-center text-[10px] text-[#7585ad]">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/* Smooth area/line chart, with an optional dashed target line. */
export function LineChart({ data = [], height = 150, showTarget = false, valueFormatter }) {
  const rows = data.slice(-14);
  if (rows.length < 2) {
    return <div className="flex h-[120px] items-center justify-center text-[12px] text-[#7585ad]">Not enough data</div>;
  }

  const w = 320;
  const h = height;
  const padX = 6;
  const padY = 14;
  const max = Math.max(
    ...rows.map((d) => Math.max(toNumber(d.sales), showTarget ? toNumber(d.target) : 0)),
    1
  );
  const stepX = (w - padX * 2) / (rows.length - 1);
  const yFor = (v) => h - padY - (toNumber(v) / max) * (h - padY * 2);
  const xFor = (i) => padX + i * stepX;

  const linePts = rows.map((d, i) => `${xFor(i)},${yFor(d.sales)}`);
  const areaPath = `M ${xFor(0)},${h - padY} L ${linePts.join(" L ")} L ${xFor(rows.length - 1)},${h - padY} Z`;
  const targetPts = showTarget ? rows.map((d, i) => `${xFor(i)},${yFor(d.target)}`).join(" ") : "";
  const last = rows[rows.length - 1];

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f6dff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#4f6dff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={padX} x2={w - padX} y1={padY + g * (h - padY * 2)} y2={padY + g * (h - padY * 2)} stroke="#e7ecf9" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="url(#lineArea)" />
        <polyline points={linePts.join(" ")} fill="none" stroke="#2f56e6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {showTarget && (
          <polyline points={targetPts} fill="none" stroke="#94a3c8" strokeWidth="1.6" strokeDasharray="4 4" />
        )}
        <circle cx={xFor(rows.length - 1)} cy={yFor(last.sales)} r="3.6" fill="#2f56e6" stroke="#fff" strokeWidth="2" />
      </svg>
      <div className="mt-[6px] flex items-center justify-between text-[10px] text-[#7585ad]">
        <span>{rows[0].label}</span>
        <span className="font-semibold text-[#23386a]">
          {valueFormatter ? valueFormatter(last.sales) : Math.round(toNumber(last.sales))}
        </span>
        <span>{last.label}</span>
      </div>
    </div>
  );
}
