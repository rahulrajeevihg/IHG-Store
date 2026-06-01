// Inline UAE Dirham (AED) currency symbol.
// Renders the symbol image scaled to the surrounding font-size and aligned to
// the text baseline, so it can sit inline next to a price like text would.
// Use `light` on dark / coloured backgrounds (e.g. the green discount badges)
// to get the white version.
export default function Dirham({ light = false, className = "", style = {} }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={light ? "/aed-white.png" : "/aed.png"}
      alt="AED"
      aria-label="AED"
      draggable={false}
      className={`inline-block shrink-0 select-none ${className}`}
      style={{ height: "0.82em", width: "auto", verticalAlign: "-0.04em", ...style }}
    />
  );
}
