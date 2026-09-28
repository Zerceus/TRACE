import { useState } from 'react'
import type { ExecutionStep } from '../types/analysis'

const STATUS_STYLES = {
  normal: {
    node: 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800',
    dot: 'bg-neutral-600',
    label: 'text-neutral-300',
    activeNode: 'border-neutral-500 bg-neutral-800',
  },
  warning: {
    node: 'border-amber-800/60 bg-amber-950/20 text-amber-200 hover:border-amber-700 hover:bg-amber-950/40',
    dot: 'bg-amber-400',
    label: 'text-amber-300',
    activeNode: 'border-amber-700 bg-amber-950/40',
  },
  failure: {
    node: 'border-red-800/70 bg-red-950/25 text-red-200 hover:border-red-700 hover:bg-red-950/40',
    dot: 'bg-red-500',
    label: 'text-red-300',
    activeNode: 'border-red-700 bg-red-950/40',
  },
}

interface ExecutionFlowProps {
  steps: ExecutionStep[]
}

export function ExecutionFlow({ steps }: ExecutionFlowProps) {
  const [selectedStep, setSelectedStep] = useState<number | null>(null)

  const handleStepClick = (index: number) => {
    setSelectedStep(selectedStep === index ? null : index)
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="relative flex flex-col">
        {steps.map((step, i) => {
          const styles = STATUS_STYLES[step.status] ?? STATUS_STYLES.normal
          const isSelected = selectedStep === i
          const isFailure = step.status === 'failure'
          const isLast = i === steps.length - 1

          return (
            <div key={i}>
              {/* Step node */}
              <div className="flex items-start gap-3">
                {/* Left column: dot + connector line */}
                <div className="flex flex-col items-center shrink-0 mt-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles.dot} ${isFailure ? 'ring-2 ring-red-700/40' : ''}`}
                    aria-hidden="true"
                  />
                  {!isLast && (
                    <div
                      className={`w-px flex-1 min-h-[24px] mt-1 ${
                        step.status === 'failure' ? 'bg-red-900/50' :
                        step.status === 'warning' ? 'bg-amber-900/40' :
                        'bg-neutral-800'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Right column: step button */}
                <div className="flex-1 pb-3">
                  <button
                    type="button"
                    onClick={() => handleStepClick(i)}
                    aria-expanded={isSelected}
                    aria-label={`Step ${i + 1}: ${step.label}. Click to ${isSelected ? 'hide' : 'show'} explanation.`}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer ${
                      isSelected ? styles.activeNode : styles.node
                    } ${isFailure ? 'font-semibold' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm ${styles.label} ${isFailure ? 'font-semibold' : ''}`}>
                        {step.label}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {isFailure && (
                          <span className="text-xs font-mono text-red-500 bg-red-950/40 border border-red-900/60 px-1.5 py-0.5 rounded">
                            FAIL
                          </span>
                        )}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          aria-hidden="true"
                          className={`text-neutral-600 transition-transform duration-200 ${isSelected ? 'rotate-180' : ''}`}
                        >
                          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Explanation panel */}
                  {isSelected && (
                    <div
                      className={`mt-2 rounded-lg border px-4 py-3 ${
                        isFailure
                          ? 'border-red-900/60 bg-red-950/20'
                          : step.status === 'warning'
                          ? 'border-amber-900/50 bg-amber-950/15'
                          : 'border-neutral-700 bg-neutral-900/80'
                      }`}
                      style={{ animation: 'var(--animate-slide-up)' }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">
                        Why This Matters
                      </p>
                      <p className="text-sm text-neutral-300 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
