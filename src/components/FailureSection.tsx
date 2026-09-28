import type { Severity } from '../types/analysis'

const SEVERITY_MAP: Record<Severity, { label: string; dot: string; text: string; border: string; bg: string }> = {
  critical: {
    label: 'Critical',
    dot: 'bg-red-500',
    text: 'text-red-400',
    border: 'border-red-900',
    bg: 'bg-red-950/30',
  },
  high: {
    label: 'High',
    dot: 'bg-red-400',
    text: 'text-red-400',
    border: 'border-red-900',
    bg: 'bg-red-950/20',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    border: 'border-amber-900',
    bg: 'bg-amber-950/20',
  },
  low: {
    label: 'Low',
    dot: 'bg-neutral-400',
    text: 'text-neutral-400',
    border: 'border-neutral-700',
    bg: 'bg-neutral-800/30',
  },
}

interface FailureSectionProps {
  title: string
  category: string
  severity: Severity
  symptom: string
}

export function FailureSection({ title, category, severity, symptom }: FailureSectionProps) {
  const s = SEVERITY_MAP[severity] ?? SEVERITY_MAP.low

  return (
    <div className={`rounded-lg border ${s.border} ${s.bg} p-4`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${s.dot} shrink-0 mt-0.5`} aria-hidden="true" />
          <span className={`text-xs font-semibold uppercase tracking-wider ${s.text}`}>
            {s.label} — {category}
          </span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.border} ${s.text} shrink-0`}>
          {severity}
        </span>
      </div>

      {/* Error title */}
      <h3 className="font-mono text-base font-semibold text-neutral-100 mb-2 leading-tight">
        {title}
      </h3>

      {/* Symptom */}
      {symptom && symptom !== title && (
        <p className="text-sm text-neutral-400 font-mono leading-relaxed">
          {symptom}
        </p>
      )}
    </div>
  )
}
