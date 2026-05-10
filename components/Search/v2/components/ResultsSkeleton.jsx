export default function ResultsSkeleton({ count = 18 }) {
  return (
    <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex h-full flex-col overflow-hidden rounded-[10px] border border-[#e9edf2] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
          <div className="animate-pulse border-b border-[#eef0f3] bg-[#f4f4f4]" style={{ paddingBottom: "48%" }} />
          <div className="space-y-[8px] p-[11px]">
            <div className="h-[10px] w-[40%] animate-pulse bg-[#f0f0f0]" />
            <div className="h-[12px] w-[85%] animate-pulse bg-[#f0f0f0]" />
            <div className="h-[12px] w-[55%] animate-pulse bg-[#f0f0f0]" />
            <div className="flex items-end justify-between pt-[6px]">
              <div className="h-[16px] w-[40%] animate-pulse bg-[#f0f0f0]" />
              <div className="h-[34px] w-[72px] animate-pulse bg-[#f0f0f0]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
