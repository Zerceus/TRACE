import type { AnalysisResult } from '../types/analysis'
import { EmptyState } from './EmptyState'
import { FailureSection } from './FailureSection'
import { RootCauseSection } from './RootCauseSection'
import { ExecutionFlow } from './ExecutionFlow'
import { MinimalFix } from './MinimalFix'
import { RegressionRisk } from './RegressionRisk'
import { PreventionSection } from './PreventionSection'

interface AnalysisPanelProps {
  result: AnalysisResult | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-3">
      {label}
    </p>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4 px-8 py-12">
      <div className="flex items-center gap-3">
        <svg
          className="animate-spin text-blue-400"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="28" strokeLinecap="round" opacity="0.3" />
          <path d="M10 2 A8 8 0 0 1 18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-sm text-neutral-400 font-medium">Reconstructing failure...</span>
      </div>
      <div className="flex gap-2 mt-2">
        {['Parsing evidence', 'Tracing execution', 'Identifying root cause'].map((step, i) => (
          <span
            key={step}
            className="text-xs text-neutral-600 px-2 py-1 rounded-md border border-neutral-800"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  )
}

export function AnalysisPanel({ result, isLoading, error, onRetry }: AnalysisPanelProps) {
  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4 px-8 py-12 text-center">
        <div className="w-10 h-10 rounded-full border border-red-900 bg-red-950/30 flex items-center justify-center">
          <span className="text-red-400 text-lg" aria-hidden="true">!</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-300 mb-1">Analysis Failed</p>
          <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">{error}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-md border border-blue-900 hover:border-blue-700 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!result) {
    return <EmptyState />
  }

  return (
    <div
      className="flex flex-col gap-5 p-5"
      style={{ animation: 'var(--animate-fade-in)' }}
      role="region"
      aria-label="Analysis results"
    >
      {/* 1. Failure */}
      <section aria-labelledby="failure-heading">
        <SectionLabel label="01 — Failure" />
        <FailureSection
          title={result.title}
          category={result.category}
          severity={result.severity}
          symptom={result.symptom}
        />
      </section>

      {/* 2. Root Cause */}
      <section aria-labelledby="rootcause-heading">
        <SectionLabel label="02 — Root Cause" />
        <RootCauseSection
          rootCause={result.rootCause}
          confidence={result.confidence}
          evidence={result.evidence}
        />
      </section>

      {/* 3. Execution Reconstruction */}
      <section aria-labelledby="execution-heading">
        <SectionLabel label="03 — Execution Reconstruction" />
        <ExecutionFlow steps={result.executionFlow} />
      </section>

      {/* 4. Minimal Fix */}
      <section aria-labelledby="fix-heading">
        <SectionLabel label="04 — Minimal Fix" />
        <MinimalFix fix={result.fix} />
      </section>

      {/* 5. Regression Risk */}
      <section aria-labelledby="regression-heading">
        <SectionLabel label="05 — Regression Risk" />
        <RegressionRisk
          regressionRisk={result.regressionRisk}
          titleHint={result.title}
        />
      </section>

      {/* 6. Prevention */}
      <section aria-labelledby="prevention-heading">
        <SectionLabel label="06 — Prevention" />
        <PreventionSection prevention={result.prevention} />
      </section>
    </div>
  )
}
