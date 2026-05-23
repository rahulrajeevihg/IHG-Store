import React from 'react';

export default function TooltipContent({
  continuous,
  index,
  isLastStep,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  size,
}) {
  const currentStep = index + 1;

  return (
    <div
      {...tooltipProps}
      style={{
        ...tooltipProps.style,
        backgroundColor: '#0f172a',
        border: '1px solid #1e3a5f',
        borderRadius: '16px',
        maxWidth: '380px',
        boxShadow: '0 28px 64px rgba(0,0,0,0.48)',
        padding: '20px',
      }}
      className="tour-tooltip"
    >
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-white text-base font-semibold tracking-tight m-0 mb-1">
          {step.title}
        </h3>
        <p className="text-[#94a3b8] text-sm leading-relaxed m-0">
          {step.content}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-widest text-[#475569] mb-2">
          Step {currentStep} of {size}
        </div>
        <div className="h-0.5 bg-[#1e3a5f] rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(currentStep / size) * 100}%` }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between gap-2">
        {/* Skip / Close */}
        <button
          {...skipProps}
          type="button"
          className="text-sm text-[#64748b] hover:text-white transition-colors px-3 py-1"
          style={skipProps.style}
        >
          {isLastStep ? 'Close' : 'Skip'}
        </button>

        {/* Back */}
        {index > 0 && (
          <button
            {...backProps}
            type="button"
            className="text-sm border border-[#1e3a5f] text-white rounded-lg px-3 py-1.5 hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors"
            style={backProps.style}
          >
            Back
          </button>
        )}

        {/* Next / Finish */}
        <button
          {...primaryProps}
          type="button"
          className="text-sm bg-blue-500 text-white rounded-lg px-4 py-1.5 hover:bg-blue-600 transition-colors ml-auto"
          style={primaryProps.style}
        >
          {isLastStep ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
