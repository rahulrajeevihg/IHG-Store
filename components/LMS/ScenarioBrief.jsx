import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeBrief, startScenario } from '@/redux/slice/lmsSlice';
import { getScenarioById } from './scenarios';

export default function ScenarioBrief() {
  const dispatch = useDispatch();
  const { briefOpen, activeScenarioId } = useSelector((state) => state.lms);
  const scenario = activeScenarioId ? getScenarioById(activeScenarioId) : null;

  if (!briefOpen || !scenario) return null;
  const brief = scenario.brief || {};

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => dispatch(closeBrief())}
    >
      <div
        className="w-full max-w-xl bg-white rounded-[16px] shadow-[0_24px_60px_rgba(0,0,0,0.22)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <span className="text-[40px]">{scenario.icon}</span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#6b7280] mb-1">
                Scenario {scenario.estimatedMinutes ? `· ${scenario.estimatedMinutes} min` : ''}
              </p>
              <h2 className="text-[22px] font-bold text-[#111] leading-[1.3]">
                {scenario.title}
              </h2>
            </div>
          </div>

          {/* Headline */}
          {brief.headline && (
            <p className="text-[15px] font-semibold text-[#111] mb-4 leading-[1.4]">
              {brief.headline}
            </p>
          )}

          {/* Body paragraphs */}
          {Array.isArray(brief.body) && brief.body.map((para, i) => (
            <p key={i} className="text-[13px] text-[#374151] leading-[1.6] mb-3">
              {para}
            </p>
          ))}

          {/* Success criteria callout */}
          {brief.successCriteria && (
            <div className="mt-5 p-4 rounded-[12px] bg-[#eff6ff] border border-[#bfdbfe]">
              <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[#1d4ed8] mb-1">
                To pass
              </p>
              <p className="text-[13px] text-[#1e3a8a] leading-[1.5]">
                {brief.successCriteria}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => dispatch(closeBrief())}
              className="flex-1 py-3 px-4 rounded-[12px] border-2 border-[#e5e7eb] text-[#374151] font-bold text-[12px] uppercase tracking-[0.12em] transition hover:bg-[#f9fafb]"
            >
              Not Now
            </button>
            <button
              onClick={() => dispatch(startScenario(scenario.id))}
              className="flex-1 py-3 px-4 rounded-[12px] bg-[#3b82f6] text-white font-bold text-[12px] uppercase tracking-[0.12em] transition hover:bg-[#2563eb]"
            >
              Begin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
