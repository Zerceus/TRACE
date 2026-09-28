import type { AnalysisType } from '../types/analysis'
import { EXAMPLES } from '../data/examples'

const ANALYSIS_TYPES: { value: AnalysisType; label: string }[] = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'error', label: 'Error / Stack Trace' },
  { value: 'code', label: 'Code' },
  { value: 'api', label: 'API Response' },
  { value: 'sql', label: 'SQL' },
  { value: 'git', label: 'Git Diff' },
]

interface InputPanelProps {
  evidence: string
  onEvidenceChange: (value: string) => void
  analysisType: AnalysisType
  onTypeChange: (type: AnalysisType) => void
  onAnalyze: () => void
  onClear: () => void
  isLoading: boolean
}

export function InputPanel({
  evidence,
  onEvidenceChange,
  analysisType,
  onTypeChange,
  onAnalyze,
  onClear,
  isLoading,
}: InputPanelProps) {
  const canAnalyze = evidence.trim().length > 0 && !isLoading

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (canAnalyze) onAnalyze()
    }
  }

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100 uppercase tracking-wider">
            Debug Evidence
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Paste an error, stack trace, or code snippet
          </p>
        </div>
        {evidence && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-neutral-500 hover:text-neutral-300 px-2 py-1 rounded border border-neutral-800 hover:border-neutral-600 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            aria-label="Clear evidence and reset"
          >
            Clear
          </button>
        )}
      </div>

      {/* Analysis type selector */}
      <div>
        <label
          htmlFor="analysis-type"
          className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-2"
        >
          Analysis Type
        </label>
        <select
          id="analysis-type"
          value={analysisType}
          onChange={(e) => onTypeChange(e.target.value as AnalysisType)}
          className="w-full bg-neutral-900 border border-neutral-700 rounded-md text-sm text-neutral-200 px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 cursor-pointer appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23737373' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
        >
          {ANALYSIS_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Evidence textarea */}
      <div className="flex-1 flex flex-col min-h-[240px]">
        <textarea
          id="evidence-input"
          aria-label="Debugging evidence input"
          value={evidence}
          onChange={(e) => onEvidenceChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste an error, stack trace, code, API response, SQL error, or Git diff..."
          spellCheck={false}
          className="flex-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg p-4 font-mono text-sm text-neutral-200 placeholder-neutral-600 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 leading-relaxed min-h-[240px]"
        />
        <p className="text-xs text-neutral-600 mt-1.5 text-right">
          ⌘ + Enter to analyze
        </p>
      </div>

      {/* Analyze button */}
      <button
        type="button"
        onClick={onAnalyze}
        disabled={!canAnalyze}
        aria-busy={isLoading}
        className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
          canAnalyze
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <>
            <Spinner />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>Analyze with TRACE</span>
          </>
        )}
      </button>

      {/* Examples */}
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
          Examples
        </p>
        <div className="flex flex-col gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() => onEvidenceChange(example.input)}
              className="text-left text-xs text-neutral-400 hover:text-neutral-100 px-3 py-2 rounded-md border border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 hover:bg-neutral-800/70 transition-all duration-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 flex items-center gap-2"
            >
              <span className="w-1 h-1 rounded-full bg-neutral-600 shrink-0" aria-hidden="true" />
              {example.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="7"
        cy="7"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="28"
        strokeDashoffset="20"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M7 1.5 A5.5 5.5 0 0 1 12.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
