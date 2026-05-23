import { useSelector, useDispatch } from 'react-redux';
import { toggleDashboard } from '@/redux/slice/lmsSlice';

export default function LMSHeaderBadge() {
  const dispatch = useDispatch();
  const { overallStatus, scenarios, tourCompleted } = useSelector((state) => state.lms);

  if (!Array.isArray(scenarios) || scenarios.length === 0) return null;

  const completedCount = scenarios.filter((s) => s.status === 'completed').length;
  const totalCount = scenarios.length;
  const isCertified = overallStatus === 'completed';

  const handleClick = () => dispatch(toggleDashboard());

  if (isCertified) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 rounded-full border border-[#a7f3d0] bg-[#ecfdf3] px-3 py-1.5 text-[11px] font-semibold text-[#047857] transition hover:bg-[#d1fae5]"
        title="Sales certification complete. Click to view scenarios."
      >
        <span className="inline-block h-2 w-2 rounded-full bg-[#047857]" />
        IHG Certified ✓
      </button>
    );
  }

  // Tour-first stage — push reps through the walkthrough before assessment
  if (!tourCompleted) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-[11px] font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
        title="Take the product tour to start training."
      >
        <span className="lms-pulse-dot inline-block h-2 w-2 rounded-full bg-[#1d4ed8]" />
        Take Product Tour
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 rounded-full border border-[#fde68a] bg-[#fffbeb] px-3 py-1.5 text-[11px] font-semibold text-[#b45309] transition hover:bg-[#fef3c7]"
      title={`Training in progress. ${completedCount} of ${totalCount} scenarios passed.`}
    >
      <span className="lms-pulse-dot inline-block h-2 w-2 rounded-full bg-[#b45309]" />
      Training · {completedCount}/{totalCount}
    </button>
  );
}
