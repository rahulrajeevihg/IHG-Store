import React from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { openBrief, toggleDashboard, resetLMS } from '@/redux/slice/lmsSlice';
import { startTour } from '@/redux/slice/tourSlice';
import { getScenarioById } from './scenarios';

const STATUS_STYLES = {
  locked:      { badge: 'bg-[#e5e7eb] text-[#6b7280]',  border: 'border-[#e5e7eb] bg-[#f9fafb] opacity-60 cursor-not-allowed', label: '🔒 Locked' },
  available:   { badge: 'bg-[#bfdbfe] text-[#1d4ed8]',  border: 'border-[#bfdbfe] bg-[#eff6ff] hover:border-[#3b82f6]',        label: 'Start' },
  in_progress: { badge: 'bg-[#fde68a] text-[#b45309]',  border: 'border-[#fde68a] bg-[#fffbeb]',                                label: '⏳ Resume' },
  completed:   { badge: 'bg-[#a7f3d0] text-[#047857]',  border: 'border-[#a7f3d0] bg-[#ecfdf3]',                                label: '✓ Passed' },
  failed:      { badge: 'bg-[#fecdd3] text-[#be123c]',  border: 'border-[#fecdd3] bg-[#fef2f2] hover:border-[#dc2626]',        label: 'Retake' },
};

function formatSeconds(s) {
  if (!s || s <= 0) return '—';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem ? `${m}m ${rem}s` : `${m}m`;
}

export default function LMSDashboard() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { scenarios, overallStatus, tourCompleted } = useSelector((state) => state.lms);

  const handleClose = () => dispatch(toggleDashboard());

  const handleStartTour = () => {
    if (typeof window === 'undefined') return;
    try {
      // Clear the tour-completion flag so TourProvider/Joyride runs fresh
      localStorage.removeItem('ihg_v1');
      dispatch(toggleDashboard()); // close dashboard so tour overlay is visible

      if (router.pathname !== '/list') {
        router.push('/list').then(() => dispatch(startTour()));
      } else {
        dispatch(startTour());
      }
    } catch (e) {
      console.error('[LMS] Failed to start tour:', e);
    }
  };

  const handleStart = (scenarioId) => {
    if (!tourCompleted) return;
    dispatch(openBrief(scenarioId));
    dispatch(toggleDashboard());
  };

  const handleReset = () => {
    if (confirm('Reset all training progress? This cannot be undone.')) {
      dispatch(resetLMS());
    }
  };

  const completedCount = scenarios.filter((s) => s.status === 'completed').length;
  const totalCount = scenarios.length;
  const progressPct = (completedCount / totalCount) * 100;
  const isCertified = overallStatus === 'completed';

  return (
    <div
      className="fixed inset-0 z-[99998] bg-black/30 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[460px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#e5e7eb] px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-bold text-[#111]">Sales Training</h2>
              <p className="text-[11px] text-[#6b7280]">
                {tourCompleted ? 'Scenario-based assessment' : 'Step 1: Product tour'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex h-[32px] w-[32px] items-center justify-center text-[22px] text-[#6b7280] hover:text-[#111] transition"
            >
              ✕
            </button>
          </div>

          {tourCompleted && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6b7280]">
                  Scenarios Passed
                </p>
                <p className="text-[12px] font-bold text-[#111]">
                  {completedCount} of {totalCount}
                </p>
              </div>
              <div className="w-full bg-[#e5e7eb] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${isCertified ? 'bg-[#16a34a]' : 'bg-[#3b82f6]'}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tour gate — shown until the rep has finished the full product tour */}
        {!tourCompleted && (
          <div className="p-6 pb-3">
            <div className="rounded-[14px] border-2 border-[#3b82f6] bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[32px] leading-none">🧭</span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#1d4ed8] font-bold mb-1">
                    Required first
                  </p>
                  <h3 className="text-[16px] font-bold text-[#0f172a] leading-tight">
                    Take the full product tour
                  </h3>
                </div>
              </div>
              <p className="text-[12px] text-[#1e3a8a] leading-[1.5] mb-2">
                A 35-step guided walkthrough covering everything: search and AI search, filters,
                every part of a product card, the detail sheet, stock indicators, customer signals,
                cart, and order confirmation.
              </p>
              <p className="text-[11px] text-[#1e40af] leading-[1.5] mb-4">
                Assessment scenarios unlock after you finish the tour. You can replay it anytime.
              </p>
              <button
                onClick={handleStartTour}
                className="w-full py-3 px-4 rounded-[12px] bg-[#3b82f6] text-white font-bold text-[12px] uppercase tracking-[0.12em] transition hover:bg-[#2563eb]"
              >
                Start Product Tour
              </button>
            </div>

            <p className="text-[11px] text-[#6b7280] text-center mt-4 px-2 leading-[1.5]">
              Assessment scenarios will be unlocked once the tour is complete.
            </p>
          </div>
        )}

        {/* Scenario list */}
        <div className="p-6 pt-3 space-y-3">
          {scenarios.map((entry) => {
            const scenario = getScenarioById(entry.id);
            if (!scenario) return null;

            // Effective status: while the tour isn't done, every scenario is gated
            const effectiveStatus = !tourCompleted ? 'locked' : entry.status;
            const style = STATUS_STYLES[effectiveStatus] || STATUS_STYLES.locked;
            const clickable = effectiveStatus !== 'locked';
            const totalTasks = scenario.type === 'tasks' ? (scenario.tasks?.length || 0) : (scenario.quiz?.questions?.length || 0);
            const completedTasks = Object.keys(entry.taskProgress || {}).length;
            const durationSec =
              entry.startedAt && entry.completedAt
                ? Math.round((entry.completedAt - entry.startedAt) / 1000)
                : null;

            return (
              <button
                key={entry.id}
                onClick={() => clickable && handleStart(entry.id)}
                disabled={!clickable}
                className={`w-full text-left p-4 rounded-[12px] border-2 transition ${style.border}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-[22px] mt-0.5">{scenario.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-[#111] truncate">
                        {scenario.title}
                      </p>
                      <p className="text-[11px] text-[#6b7280] mt-0.5">
                        {scenario.type === 'quiz' ? 'Quiz' : 'Live Tasks'} · {scenario.estimatedMinutes || 3} min
                      </p>
                    </div>
                  </div>
                  <div className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] ${style.badge}`}>
                    {style.label}
                  </div>
                </div>

                {scenario.brief?.headline && (
                  <p className="text-[12px] text-[#374151] leading-[1.5] mb-2">
                    {scenario.brief.headline}
                  </p>
                )}

                {/* Result row for completed/failed scenarios */}
                {(entry.status === 'completed' || entry.status === 'failed') && entry.score !== null && (
                  <div className="mt-3 pt-3 border-t border-[#e5e7eb] grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.1em] text-[#6b7280] font-semibold">Score</p>
                      <p className={`text-[14px] font-bold ${entry.status === 'completed' ? 'text-[#047857]' : 'text-[#be123c]'}`}>
                        {entry.score}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.1em] text-[#6b7280] font-semibold">
                        {scenario.type === 'quiz' ? 'Correct' : 'Tasks'}
                      </p>
                      <p className="text-[14px] font-bold text-[#111]">
                        {scenario.type === 'quiz'
                          ? `${Math.round((entry.score / 100) * totalTasks)}/${totalTasks}`
                          : `${completedTasks}/${totalTasks}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.1em] text-[#6b7280] font-semibold">Time</p>
                      <p className="text-[14px] font-bold text-[#111]">
                        {formatSeconds(durationSec)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Per-task pass/fail breakdown when failed */}
                {entry.status === 'failed' && scenario.type === 'tasks' && (
                  <div className="mt-3 pt-3 border-t border-[#fecdd3] space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#be123c] font-semibold mb-1">
                      Tasks not completed
                    </p>
                    {scenario.tasks?.filter((t) => !entry.taskProgress?.[t.id]).map((t) => (
                      <p key={t.id} className="text-[11px] text-[#7f1d1d] leading-[1.4]">
                        ✗ {t.label}
                      </p>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#f9fafb] border-t border-[#e5e7eb] px-6 py-4 space-y-2">
          {isCertified ? (
            <div className="text-center mb-1">
              <p className="text-[14px] font-bold text-[#047857] mb-1">🏆 IHG Sales Certified</p>
              <p className="text-[12px] text-[#6b7280]">You've passed every scenario.</p>
            </div>
          ) : tourCompleted ? (
            <p className="text-[11px] text-[#6b7280] text-center leading-[1.5]">
              Complete each scenario to unlock the next. Pass all 7 to earn certification.
            </p>
          ) : null}

          {tourCompleted && (
            <button
              onClick={handleStartTour}
              className="w-full text-[11px] font-semibold text-[#3b82f6] hover:text-[#1d4ed8] py-1 transition"
            >
              ↻ Replay product tour
            </button>
          )}

          <button
            onClick={handleReset}
            className="w-full text-[10px] uppercase tracking-[0.1em] text-[#9ca3af] hover:text-[#dc2626] py-1 transition"
          >
            Reset progress
          </button>
        </div>
      </div>
    </div>
  );
}
