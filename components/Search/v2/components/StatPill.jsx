export default function StatPill({ label, value }) {
  return (
    <div className="inline-flex items-baseline gap-[8px] border border-[#e5e5e5] bg-white px-[10px] py-[6px]">
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#9ca3af]">
        {label}
      </span>
      <span className="text-[12px] font-semibold text-[#111]">{value}</span>
    </div>
  );
}
