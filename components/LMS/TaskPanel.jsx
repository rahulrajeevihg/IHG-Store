import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { completeTask, finishScenario, abortScenario, setTaskInput } from '@/redux/slice/lmsSlice';
import { getScenarioById } from './scenarios';

// Sticky bottom panel that runs every task's check(state) on each render and
// ticks them off live as Redux state matches. When all tasks are done, the
// scenario auto-finishes after a short "well done" pause.
export default function TaskPanel() {
  const dispatch = useDispatch();
  const fullState = useSelector((state) => state);
  const { activeScenarioId, scenarios } = fullState.lms;
  const scenario = activeScenarioId ? getScenarioById(activeScenarioId) : null;
  const scenarioState = scenarios.find((s) => s.id === activeScenarioId);

  const [collapsed, setCollapsed] = useState(false);
  const [hintFor, setHintFor] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const finishTimerRef = useRef(null);

  const tasks = scenario?.tasks || [];

  // Live evaluation of each task against current Redux state
  const liveStatus = useMemo(() => {
    return tasks.map((task) => {
      const persisted = scenarioState?.taskProgress?.[task.id];
      const passing = !!task.check?.(fullState);
      return { task, persistedCompleted: !!persisted, passing };
    });
    // Re-evaluate whenever Redux state changes
  }, [fullState, tasks, scenarioState]);

  // Dispatch completeTask for any task newly passing
  useEffect(() => {
    if (!scenario || !scenarioState || scenarioState.status !== 'in_progress') return;
    for (const { task, persistedCompleted, passing } of liveStatus) {
      if (passing && !persistedCompleted) {
        dispatch(completeTask({ scenarioId: scenario.id, taskId: task.id }));
      }
    }
  }, [liveStatus, scenario, scenarioState, dispatch]);

  const completedCount = liveStatus.filter((l) => l.persistedCompleted || l.passing).length;
  const totalCount = tasks.length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  // Auto-finish when all tasks pass — short celebration pause, then finalize
  useEffect(() => {
    if (!scenario || !scenarioState || scenarioState.status !== 'in_progress') return;
    if (!allDone) return;
    if (finishTimerRef.current) return;

    setCelebrating(true);
    finishTimerRef.current = setTimeout(() => {
      dispatch(finishScenario({
        scenarioId: scenario.id,
        totalTasks: totalCount,
        passThreshold: scenario.passThreshold ?? 80,
      }));
      finishTimerRef.current = null;
      setCelebrating(false);
    }, 1800);

    return () => {
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
    };
  }, [allDone, scenario, scenarioState, dispatch, totalCount]);

  if (!scenario || scenario.type !== 'tasks' || !scenarioState || scenarioState.status !== 'in_progress') {
    return null;
  }

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleGiveUp = () => {
    if (confirm('Exit this scenario? Your progress on this attempt will be discarded.')) {
      dispatch(abortScenario());
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[90000] w-[360px] max-w-[calc(100vw-2rem)] pointer-events-none">
      <div className={`pointer-events-auto rounded-[14px] border-2 shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition ${
        celebrating
          ? 'border-[#16a34a] bg-[#ecfdf3]'
          : 'border-[#3b82f6] bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[18px]">{scenario.icon}</span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#6b7280] leading-tight">
                Live Scenario
              </p>
              <p className="text-[13px] font-bold text-[#111] truncate">
                {scenario.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="h-7 w-7 inline-flex items-center justify-center text-[#6b7280] hover:text-[#111] text-[14px]"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? '▴' : '▾'}
            </button>
            <button
              onClick={handleGiveUp}
              className="h-7 w-7 inline-flex items-center justify-center text-[#6b7280] hover:text-[#dc2626] text-[16px]"
              title="Exit scenario"
            >
              ×
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#6b7280] font-semibold">
              {completedCount} of {totalCount} done
            </p>
            <p className="text-[10px] font-bold text-[#3b82f6]">{progressPct}%</p>
          </div>
          <div className="w-full bg-[#e5e7eb] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${celebrating ? 'bg-[#16a34a]' : 'bg-[#3b82f6]'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Task list */}
        {!collapsed && (
          <div className="px-4 py-3 space-y-2 max-h-[340px] overflow-y-auto">
            {liveStatus.map(({ task, persistedCompleted, passing }) => (
              <TaskRow
                key={task.id}
                task={task}
                scenarioId={scenario.id}
                done={persistedCompleted || passing}
                hintOpen={hintFor === task.id}
                onToggleHint={() => setHintFor(hintFor === task.id ? null : task.id)}
              />
            ))}

            {celebrating && (
              <div className="mt-3 p-3 rounded-[10px] bg-[#ecfdf3] border border-[#a7f3d0] text-center">
                <p className="text-[14px] font-bold text-[#047857]">
                  ✓ All tasks complete!
                </p>
                <p className="text-[11px] text-[#16a34a] mt-0.5">
                  Scoring your scenario…
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Renders one row of the checklist. For tasks with `inputType` set, also
// renders an input box + Verify button. On submit, dispatches setTaskInput;
// if the task's check(state) accepts the value it ticks automatically. If
// not, we show the task's `wrongMessage` so the user knows to try again.
function TaskRow({ task, scenarioId, done, hintOpen, onToggleHint }) {
  const dispatch = useDispatch();
  const persistedAnswer = useSelector((state) => state.lms?.inputAnswers?.[task.id] || '');
  const [draft, setDraft] = useState(persistedAnswer);
  const [submittedOnce, setSubmittedOnce] = useState(!!persistedAnswer);

  // Keep local draft in sync if Redux is wiped (e.g. attempt reset)
  useEffect(() => {
    if (!persistedAnswer) {
      setDraft('');
      setSubmittedOnce(false);
    }
  }, [persistedAnswer]);

  const handleSubmit = () => {
    const value = draft.trim();
    setSubmittedOnce(true);
    dispatch(setTaskInput({ taskId: task.id, value }));
  };

  const showWrongFeedback = task.inputType && submittedOnce && !done && persistedAnswer.trim().length > 0;

  return (
    <div>
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition ${
          done
            ? 'bg-[#16a34a] text-white'
            : 'bg-white border-2 border-[#d1d5db] text-transparent'
        }`}>
          ✓
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[12px] leading-[1.4] ${
            done ? 'text-[#047857] line-through' : 'text-[#111]'
          }`}>
            {task.label}
          </p>

          {task.hint && !done && (
            <button
              onClick={onToggleHint}
              className="text-[10px] text-[#3b82f6] hover:underline mt-0.5"
            >
              {hintOpen ? 'Hide hint' : '💡 Hint'}
            </button>
          )}
          {hintOpen && task.hint && !done && (
            <p className="text-[11px] text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-[8px] px-2 py-1.5 mt-1 leading-[1.4]">
              {task.hint}
            </p>
          )}

          {/* Input task UI */}
          {task.inputType && !done && (
            <div className="mt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                  placeholder={task.inputPlaceholder || 'Type your answer'}
                  className={`flex-1 min-w-0 rounded-[8px] border-2 px-2.5 py-1.5 text-[12px] font-mono outline-none transition ${
                    showWrongFeedback
                      ? 'border-[#dc2626] bg-[#fef2f2] text-[#7f1d1d]'
                      : 'border-[#d1d5db] bg-white focus:border-[#3b82f6]'
                  }`}
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="characters"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus={false}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!draft.trim()}
                  className={`px-3 py-1.5 rounded-[8px] text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                    draft.trim()
                      ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
                      : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                  }`}
                >
                  Verify
                </button>
              </div>
              {showWrongFeedback && (
                <p className="text-[11px] text-[#be123c] bg-[#fef2f2] border border-[#fecdd3] rounded-[8px] px-2 py-1.5 mt-1.5 leading-[1.4]">
                  {task.wrongMessage || 'Not quite — try again.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
