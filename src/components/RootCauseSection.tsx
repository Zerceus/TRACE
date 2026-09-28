import type { Confidence } from '../types/analysis'

const CONFIDENCE_STYLE: Record<Confidence, string> = {
  high: 'text-green-400 bg-green-950/40 border-green-900',
  medium: 'text-amber-400 bg-amber-950/30 border-amber-900',
  low: 'text-neutral-400 bg-neutral-800/40 border-neutral-700',
}

interface RootCauseSectionProps {
  rootCause: string
  confidence: Confidence
  evidence: string[]
}

export function RootCauseSection({ rootCause, confidence, evidence }: RootCauseSectionProps) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
      {/* Section label */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Root Cause
        </h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CONFIDENCE_STYLE[confidence]}`}>
          Confidence: {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
        </span>
      </div>

      {/* Root cause statement */}
      <p className="text-sm text-neutral-100 font-medium leading-relaxed mb-4">
        {rootCause}
      </p>

      {/* Evidence list */}
      {evidence.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
            Evidence
          </p>
          <ol className="flex flex-col gap-2">
            {evidence.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-400">
                <span className="shrink-0 font-mono text-xs text-neutral-600 bg-neutral-800 rounded px-1.5 py-0.5 mt-0.5 min-w-[22px] text-center">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
