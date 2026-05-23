// Lightweight, dependency-free SVG icon set (lucide-style, 24px grid, 1.75 stroke).
// Kept inline so the dashboard ships no extra icon package and stays crisp + themeable.

function Svg({ children, size = 20, className = "", strokeWidth = 1.75, fill = "none", ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>
);
export const ScanIcon = (p) => (
  <Svg {...p}><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></Svg>
);
export const BellIcon = (p) => (
  <Svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Svg>
);
export const ChevronDownIcon = (p) => (
  <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
);
export const ArrowRightIcon = (p) => (
  <Svg {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Svg>
);
export const ArrowUpRightIcon = (p) => (
  <Svg {...p}><path d="M7 17 17 7" /><path d="M7 7h10v10" /></Svg>
);
export const RefreshIcon = (p) => (
  <Svg {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></Svg>
);
export const StarIcon = (p) => (
  <Svg fill="currentColor" stroke="none" {...p}><path d="m12 2 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z" /></Svg>
);
export const TargetIcon = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></Svg>
);
export const TrendingUpIcon = (p) => (
  <Svg {...p}><path d="M3 17 9 11l4 4 8-8" /><path d="M16 7h5v5" /></Svg>
);
export const TrendingDownIcon = (p) => (
  <Svg {...p}><path d="M3 7 9 13l4-4 8 8" /><path d="M16 17h5v-5" /></Svg>
);
export const AlertTriangleIcon = (p) => (
  <Svg {...p}><path d="M10.3 3.7 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></Svg>
);
export const PackageIcon = (p) => (
  <Svg {...p}><path d="m7.5 4.3 9 0L21 8v8l-9 5-9-5V8Z" /><path d="m3 8 9 5 9-5" /><path d="M12 13v8" /></Svg>
);
export const SparklesIcon = (p) => (
  <Svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6.3 6.3 2 2M15.7 15.7l2 2M17.7 6.3l-2 2M8.3 15.7l-2 2" /></Svg>
);
export const CartIcon = (p) => (
  <Svg {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.4 12.4a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.2L21.5 7H6" /></Svg>
);
export const BoxesIcon = (p) => (
  <Svg {...p}><path d="M3.5 8 7 6l3.5 2v4L7 14l-3.5-2Z" /><path d="M13.5 8 17 6l3.5 2v4L17 14l-3.5-2Z" /><path d="M8.5 15 12 13l3.5 2v4L12 21l-3.5-2Z" /></Svg>
);
export const UsersIcon = (p) => (
  <Svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></Svg>
);
export const WalletIcon = (p) => (
  <Svg {...p}><path d="M3 7a2 2 0 0 1 2-2h13v3" /><path d="M3 7v10a2 2 0 0 0 2 2h15V8H5a2 2 0 0 1-2-2Z" /><path d="M16 13h.01" /></Svg>
);
export const ReceiptIcon = (p) => (
  <Svg {...p}><path d="M5 3v18l2-1.2L9 21l2-1.2L13 21l2-1.2L17 21l2-1.2V3l-2 1.2L15 3l-2 1.2L11 3 9 4.2 7 3Z" /><path d="M8 8h8M8 12h8M8 16h5" /></Svg>
);
export const BookOpenIcon = (p) => (
  <Svg {...p}><path d="M12 6.5C10.5 5 7.5 4.5 4 5v13c3.5-.5 6.5 0 8 1.5 1.5-1.5 4.5-2 8-1.5V5c-3.5-.5-6.5 0-8 1.5Z" /><path d="M12 6.5V19.5" /></Svg>
);
export const ShareIcon = (p) => (
  <Svg {...p}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6" /></Svg>
);
export const ZapIcon = (p) => (
  <Svg {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7Z" /></Svg>
);
export const DropletIcon = (p) => (
  <Svg {...p}><path d="M12 2.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5Z" /></Svg>
);
export const LightbulbIcon = (p) => (
  <Svg {...p}><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0 0 12 3Z" /></Svg>
);
export const WrenchIcon = (p) => (
  <Svg {...p}><path d="M14.5 5.5a4 4 0 0 1 5 5l-9.5 9.5a2.1 2.1 0 0 1-3-3L16.5 7.5" /><path d="M14.5 5.5 11 9" /></Svg>
);
export const HammerIcon = (p) => (
  <Svg {...p}><path d="m14 6 4 4-7.5 7.5a2.1 2.1 0 0 1-3-3L15 7" /><path d="m11 3 6 6 3-3-6-6Z" /></Svg>
);
export const ClockIcon = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
);
export const RotateLeftIcon = (p) => (
  <Svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Svg>
);
export const BotIcon = (p) => (
  <Svg {...p}><rect x="4" y="8" width="16" height="11" rx="3" /><path d="M12 4v4M12 4a1.5 1.5 0 1 0 0-.01" /><circle cx="9" cy="13" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="13" r="1.1" fill="currentColor" stroke="none" /><path d="M9.5 16.5h5" /></Svg>
);
export const CheckCircleIcon = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></Svg>
);
export const FlameIcon = (p) => (
  <Svg {...p}><path d="M12 3c1 3-1.5 4.5-1.5 7A1.5 1.5 0 0 0 13 11c.5-1 .5-1.5.5-1.5 2 1.5 3 3.5 3 5.5a4.5 4.5 0 0 1-9 0c0-3 2-4.5 2-6 0-2 2.5-3.5 2.5-6Z" /></Svg>
);

// Maps for data-driven sections -------------------------------------------------

export function QuickActionIcon({ label, ...rest }) {
  const key = String(label || "").toLowerCase();
  if (key.includes("order")) return <CartIcon {...rest} />;
  if (key.includes("stock")) return <BoxesIcon {...rest} />;
  if (key.includes("ledger")) return <UsersIcon {...rest} />;
  if (key.includes("outstanding")) return <WalletIcon {...rest} />;
  if (key.includes("arrival")) return <SparklesIcon {...rest} />;
  if (key.includes("credit")) return <ReceiptIcon {...rest} />;
  if (key.includes("catalog")) return <BookOpenIcon {...rest} />;
  if (key.includes("share")) return <ShareIcon {...rest} />;
  return <ArrowUpRightIcon {...rest} />;
}

export function CategoryIcon({ name, ...rest }) {
  const key = String(name || "").toLowerCase();
  if (key.includes("electric") || key.includes("switch") || key.includes("cable")) return <ZapIcon {...rest} />;
  if (key.includes("plumb") || key.includes("pipe") || key.includes("water") || key.includes("pvc")) return <DropletIcon {...rest} />;
  if (key.includes("light") || key.includes("lamp") || key.includes("led") || key.includes("bulb")) return <LightbulbIcon {...rest} />;
  if (key.includes("hardware") || key.includes("fitting")) return <WrenchIcon {...rest} />;
  if (key.includes("tool")) return <HammerIcon {...rest} />;
  return <PackageIcon {...rest} />;
}

export function InsightIcon({ id = "", severity = "info", ...rest }) {
  if (id.includes("trajectory")) return severity === "success" ? <TrendingUpIcon {...rest} /> : <TrendingDownIcon {...rest} />;
  if (id.includes("trending")) return <FlameIcon {...rest} />;
  if (id.includes("60-days") || id.includes("overdue")) return severity === "success" ? <CheckCircleIcon {...rest} /> : <AlertTriangleIcon {...rest} />;
  if (id.includes("stock")) return severity === "success" ? <CheckCircleIcon {...rest} /> : <PackageIcon {...rest} />;
  if (severity === "success") return <CheckCircleIcon {...rest} />;
  if (severity === "critical") return <AlertTriangleIcon {...rest} />;
  if (severity === "warning") return <AlertTriangleIcon {...rest} />;
  return <SparklesIcon {...rest} />;
}
